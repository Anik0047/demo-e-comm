"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import type { NewsletterContent } from "@/types/footer";

interface NewsletterFormProps {
  content: NewsletterContent;
}

export function NewsletterForm({ content }: NewsletterFormProps) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus("error");
      return;
    }
    setEmail("");
    setStatus("success");
  }

  return (
    <div className="mt-6">
      <label htmlFor={id} className="text-sm font-bold text-ink">{content.label}</label>
      <form noValidate onSubmit={handleSubmit} className="mt-3 flex max-w-md flex-col gap-2 sm:flex-row">
        <input
          id={id}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={content.placeholder}
          value={email}
          onChange={(event) => { setEmail(event.target.value); setStatus("idle"); }}
          aria-invalid={status === "error"}
          aria-describedby={`${id}-message`}
          className="input min-w-0 sm:flex-1 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        <button type="submit" className="btn btn-primary btn-md shrink-0">{content.submitLabel}</button>
      </form>
      <div id={`${id}-message`} aria-live="polite" aria-atomic="true" className="mt-2 min-h-5 text-sm">
        {status === "error" && <p className="text-sale-strong">{content.errorMessage}</p>}
        {status === "success" && <p className="text-brand-strong">{content.successMessage}</p>}
      </div>
    </div>
  );
}
