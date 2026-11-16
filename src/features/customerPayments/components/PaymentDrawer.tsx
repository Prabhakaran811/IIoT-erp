import { useEffect, useMemo, useState } from "react";

import {
  PAYMENT_MODES,
  formatMoney,
  invoiceLabel,
} from "../customerPaymentTypes";
import type {
  CustomerPayment,
  OutstandingInvoice,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentMode,
} from "../customerPaymentTypes";

interface Props {
  open: boolean;
  payment: CustomerPayment | null; // null = new receipt
  invoices: OutstandingInvoice[];
  invoicesLoading: boolean;
  nextReceiptNumber: string;
  saving: boolean;
  serverError: string;
  onClose: () => void;
  onSubmit: (data: CreatePaymentRequest | UpdatePaymentRequest) => void;
}

interface FormState {
  receiptNumber: string;
  receiptDate: string;
  serviceBill: string;
  paymentAmount: string;
  paymentMode: PaymentMode;
  transactionReference: string;
  depositedBank: string;
  receiptRemarks: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const todayISO = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

export default function PaymentDrawer({
  open,
  payment,
  invoices,
  invoicesLoading,
  nextReceiptNumber,
  saving,
  serverError,
  onClose,
  onSubmit,
}: Props) {
  const isEditing = payment !== null;

  const blank = (): FormState => ({
    receiptNumber: nextReceiptNumber,
    receiptDate: todayISO(),
    serviceBill: "",
    paymentAmount: "",
    paymentMode: "Bank Transfer",
    transactionReference: "",
    depositedBank: "",
    receiptRemarks: "",
  });

  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<Errors>({});

  // Reset whenever the drawer opens
  useEffect(() => {
    if (!open) return;

    if (payment) {
      setForm({
        receiptNumber: payment.receiptNumber,
        receiptDate: (payment.receiptDate ?? "").slice(0, 10),
        serviceBill:
          typeof payment.serviceBill === "object" && payment.serviceBill
            ? payment.serviceBill._id
            : String(payment.serviceBill ?? ""),
        paymentAmount: String(payment.paymentAmount ?? ""),
        paymentMode: (PAYMENT_MODES as readonly string[]).includes(payment.paymentMode)
          ? (payment.paymentMode as PaymentMode)
          : "Other",
        transactionReference: payment.transactionReference ?? "",
        depositedBank: payment.depositedBank ?? "",
        receiptRemarks: payment.receiptRemarks ?? "",
      });
    } else {
      setForm(blank());
    }

    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const invoice = useMemo(
    () => invoices.find((i) => i._id === form.serviceBill) ?? null,
    [invoices, form.serviceBill]
  );

  const amount = Number(form.paymentAmount) || 0;
  const balanceAfter = invoice ? invoice.outstandingAmount - amount : null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Errors = {};
    const value = Number(form.paymentAmount);

    if (!isEditing) {
      if (!form.receiptNumber.trim()) errs.receiptNumber = "Receipt number is required";
      if (!form.receiptDate) errs.receiptDate = "Select the receipt date";
      if (!form.serviceBill) errs.serviceBill = "Select an invoice";
    }

    if (!Number.isFinite(value) || form.paymentAmount.trim() === "" || value <= 0) {
      errs.paymentAmount = "Enter an amount greater than 0";
    } else if (!isEditing && invoice && value > invoice.outstandingAmount) {
      errs.paymentAmount = `Cannot be more than the outstanding ${formatMoney(invoice.outstandingAmount)}`;
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const shared = {
      paymentAmount: value,
      paymentMode: form.paymentMode,
      transactionReference: form.transactionReference.trim(),
      depositedBank: form.depositedBank.trim(),
      receiptRemarks: form.receiptRemarks.trim(),
    };

    if (isEditing) {
      onSubmit(shared satisfies UpdatePaymentRequest);
    } else {
      onSubmit({
        receiptNumber: form.receiptNumber.trim(),
        receiptDate: form.receiptDate,
        serviceBill: form.serviceBill,
        ...shared,
      } satisfies CreatePaymentRequest);
    }
  };

  return (
    <>
      <div className={`cp-overlay ${open ? "is-open" : ""}`} onClick={onClose} />

      <aside className={`cp-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <header className="cp-drawer__head">
          <div>
            <h2>{isEditing ? "Edit payment" : "New payment receipt"}</h2>
            <p>
              {isEditing
                ? `Receipt ${payment?.receiptNumber}`
                : "Record a payment against an approved service invoice."}
            </p>
          </div>
          <button type="button" className="cp-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <form className="cp-form" onSubmit={handleSubmit} noValidate>
          <div className="cp-grid">
            <label className={`cp-field ${errors.receiptNumber ? "has-error" : ""}`}>
              <span>Receipt number</span>
              <input
                value={form.receiptNumber}
                onChange={(e) => set("receiptNumber", e.target.value)}
                disabled={isEditing}
                placeholder="REC-2026-001"
              />
              {errors.receiptNumber && <small>{errors.receiptNumber}</small>}
            </label>

            <label className={`cp-field ${errors.receiptDate ? "has-error" : ""}`}>
              <span>Receipt date</span>
              <input
                type="date"
                value={form.receiptDate}
                onChange={(e) => set("receiptDate", e.target.value)}
                disabled={isEditing}
              />
              {errors.receiptDate && <small>{errors.receiptDate}</small>}
            </label>
          </div>

          {/* Invoice */}
          <label className={`cp-field ${errors.serviceBill ? "has-error" : ""}`}>
            <span>Service invoice</span>

            {isEditing ? (
              <input value={invoiceLabel(payment?.serviceBill ?? null)} disabled />
            ) : (
              <select
                value={form.serviceBill}
                onChange={(e) => set("serviceBill", e.target.value)}
                disabled={invoicesLoading}
              >
                <option value="">
                  {invoicesLoading ? "Loading invoices..." : "Select outstanding invoice"}
                </option>
                {invoices.map((inv) => (
                  <option key={inv._id} value={inv._id}>
                    {inv.invoiceNumber} · Due {formatMoney(inv.outstandingAmount)}
                  </option>
                ))}
              </select>
            )}

            {errors.serviceBill && <small>{errors.serviceBill}</small>}
            {!isEditing && !invoicesLoading && invoices.length === 0 && (
              <small className="cp-hint">No approved invoices with a balance right now.</small>
            )}
          </label>

          {invoice && (
            <div className="cp-summary">
              <div>
                <span>Invoice total</span>
                <strong>{formatMoney(invoice.grandTotal)}</strong>
              </div>
              <div>
                <span>Already paid</span>
                <strong>{formatMoney(invoice.paidAmount)}</strong>
              </div>
              <div>
                <span>Outstanding</span>
                <strong>{formatMoney(invoice.outstandingAmount)}</strong>
              </div>
              <div className={`cp-summary__after ${balanceAfter !== null && balanceAfter < 0 ? "is-over" : ""}`}>
                <span>Balance after this payment</span>
                <strong>{formatMoney(balanceAfter ?? 0)}</strong>
              </div>
            </div>
          )}

          <div className="cp-grid">
            <label className={`cp-field ${errors.paymentAmount ? "has-error" : ""}`}>
              <span>Payment amount (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.paymentAmount}
                onChange={(e) => set("paymentAmount", e.target.value)}
                placeholder="10000"
              />
              {errors.paymentAmount && <small>{errors.paymentAmount}</small>}
            </label>

            <label className="cp-field">
              <span>Payment mode</span>
              <select
                value={form.paymentMode}
                onChange={(e) => set("paymentMode", e.target.value as PaymentMode)}
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>

            <label className="cp-field">
              <span>Transaction reference</span>
              <input
                value={form.transactionReference}
                onChange={(e) => set("transactionReference", e.target.value)}
                placeholder="UTR / cheque / UPI ref"
              />
            </label>

            <label className="cp-field">
              <span>Deposited bank</span>
              <input
                value={form.depositedBank}
                onChange={(e) => set("depositedBank", e.target.value)}
                placeholder="HDFC Bank"
              />
            </label>
          </div>

          <label className="cp-field">
            <span>Remarks</span>
            <textarea
              rows={3}
              value={form.receiptRemarks}
              onChange={(e) => set("receiptRemarks", e.target.value)}
              placeholder="First partial payment against service invoice"
            />
          </label>

          {serverError && (
            <p className="cp-error" role="alert">
              {serverError}
            </p>
          )}

          <footer className="cp-form__foot">
            <button type="button" className="cp-btn cp-btn--ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="cp-btn cp-btn--primary" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save changes" : "Save receipt"}
            </button>
          </footer>
        </form>
      </aside>
    </>
  );
}