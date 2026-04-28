import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
