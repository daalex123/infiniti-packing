(function () {
  var config = window.CONTACT_FORM_CONFIG || {};

  function getAccessKey() {
    var key = config.accessKey || config.web3formsAccessKey;
    if (!key || key === "YOUR_WEB3FORMS_ACCESS_KEY") return "";
    return key;
  }

  function initContactForm(form) {
    if (!form || form.dataset.contactFormReady === "true") return;

    var statusId = form.getAttribute("data-status-id") || "contact-form-status";
    var statusEl = document.getElementById(statusId);
    var submitBtn = form.querySelector('[type="submit"]');
    var defaultBtnLabel = submitBtn ? submitBtn.textContent : "Send message";

    (function syncAccessKey() {
      var key = getAccessKey();
      if (!key) return;
      var hidden = form.querySelector('input[name="access_key"]');
      if (hidden) hidden.value = key;
    })();

    function setStatus(type, message) {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.className =
        "contact-form-status contact-form-status--" +
        type +
        " mt-unit-md rounded-lg border px-unit-md py-unit-sm font-body-sm text-body-sm";
      statusEl.textContent = message;
      statusEl.setAttribute("role", type === "error" ? "alert" : "status");
    }

    function clearStatus() {
      if (!statusEl) return;
      statusEl.hidden = true;
      statusEl.textContent = "";
      statusEl.removeAttribute("role");
    }

    function setLoading(loading) {
      if (submitBtn) {
        submitBtn.disabled = loading;
        submitBtn.setAttribute("aria-busy", loading ? "true" : "false");
        submitBtn.textContent = loading ? "Sending…" : defaultBtnLabel;
      }
      form.querySelectorAll("input, textarea, select, button").forEach(function (el) {
        if (el !== submitBtn && el.name !== "h-captcha-response") el.disabled = loading;
      });
    }

    function readForm() {
      var fd = new FormData(form);
      return {
        name: (fd.get("name") || "").toString().trim(),
        email: (fd.get("email") || "").toString().trim(),
        phone: (fd.get("phone") || "").toString().trim(),
        company: (fd.get("company") || "").toString().trim(),
        subject: (fd.get("subject") || "").toString().trim(),
        message: (fd.get("message") || "").toString().trim(),
      };
    }

    function getHCaptchaResponse() {
      var field = form.querySelector('textarea[name="h-captcha-response"]');
      return field ? field.value.trim() : "";
    }

    function resetHCaptcha() {
      if (typeof window.hcaptcha === "undefined") return;
      var widget = form.querySelector(".h-captcha");
      if (!widget) return;
      var widgetId = widget.getAttribute("data-hcaptcha-widget-id");
      if (widgetId) window.hcaptcha.reset(widgetId);
    }

    function validate(data) {
      if (!data.name) return "Please enter your name.";
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return "Please enter a valid email address.";
      }
      if (!data.subject) return "Please enter a subject.";
      if (!data.message || data.message.length < 10) {
        return "Please enter a message (at least 10 characters).";
      }
      if (!getHCaptchaResponse()) {
        return "Please complete the captcha before sending.";
      }
      return "";
    }

    function buildPayload(data) {
      var lines = [data.message];
      if (data.phone) lines.push("", "Phone: " + data.phone);
      if (data.company) lines.push("Company: " + data.company);

      return {
        access_key: getAccessKey(),
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: lines.join("\n"),
        phone: data.phone || undefined,
        company: data.company || undefined,
        from_name: "Infiniti Sourcing — Website",
        botcheck: "",
        "h-captcha-response": getHCaptchaResponse(),
      };
    }

    function submitWeb3Forms(data) {
      var key = getAccessKey();
      if (!key) {
        return Promise.reject(
          new Error(
            "Form is not active yet. Add your Web3Forms access key in contact-form-config.js (free at web3forms.com)."
          )
        );
      }

      return fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(buildPayload(data)),
      }).then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok || !json.success) {
            throw new Error(json.message || "Could not send your message. Please try again.");
          }
          return json;
        });
      });
    }

    if (form.id === "contact-enquiry-form" && new URLSearchParams(window.location.search).get("sent") === "1") {
      setStatus("success", "Thank you — your message was sent. We will reply as soon as we can.");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearStatus();

      var botcheck = form.querySelector('[name="botcheck"]');
      if (botcheck && botcheck.checked) return;

      var data = readForm();
      var err = validate(data);
      if (err) {
        setStatus("error", err);
        return;
      }

      setLoading(true);
      submitWeb3Forms(data)
        .then(function () {
          form.reset();
          if (botcheck) botcheck.checked = false;
          resetHCaptcha();
          setStatus(
            "success",
            "Thank you — your message was sent. We will reply to " + data.email + " as soon as we can."
          );
          form.scrollIntoView({ behavior: "smooth", block: "nearest" });
        })
        .catch(function (error) {
          setStatus(
            "error",
            error.message ||
              "Something went wrong. Please email " +
                (config.recipientEmail || "info@infiniti-sourcing.com") +
                " directly."
          );
        })
        .finally(function () {
          setLoading(false);
        });
    });

    form.dataset.contactFormReady = "true";
  }

  var forms = document.querySelectorAll(".js-contact-enquiry-form");
  if (!forms.length) {
    var legacy = document.getElementById("contact-enquiry-form");
    if (legacy) forms = [legacy];
  }
  forms.forEach(initContactForm);
})();
