import {
  Checkbox,
  reactExtension,
  useBuyerJourneyIntercept,
  useExtensionCapability,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

import { useState } from "react";

export default reactExtension("purchase.checkout.delivery-address.render-after", () => (
  <PrivacyPolicyAcceptance />
));



function PrivacyPolicyAcceptance() {
  const [checked, setChecked] = useState(false);
  const [validationError, setValidationError] = useState("");

  const {
    checkboxContent: merchantCheckboxContent,
    checkboxError: merchantCheckboxError,
  } = useSettings();

  const checkboxContent =
    merchantCheckboxContent ?? "Please check this checkbox to continue";
  const checkboxError = merchantCheckboxError ?? "Custom Error";

  const canBlockProgress = useExtensionCapability("block_progress");

  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (canBlockProgress && checked == false) {
      return {
        behavior: "block",
        reason: "Need to accept privacy policy",
        perform: (result) => {
          // If progress can be blocked, then set a validation error on the custom field
          if (result.behavior === "block") {
            setValidationError(`${checkboxError}`);
          }
        },
      };
    }

    return {
      behavior: "allow",
      perform: () => {
        clearValidationErrors();
      },
    };
  });

  function clearValidationErrors() {
    setValidationError("");
  }

  return (
    <Checkbox
      id="privacy-policy-agreement"
      name="checkbox"
      onChange={setChecked}
      error={validationError}
    >
      {checkboxContent}
    </Checkbox>
  );
}
