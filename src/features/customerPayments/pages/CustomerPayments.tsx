
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { customerPaymentApi } from "../customerPaymentApi";

import {
  PAYMENT_MODES,
  formatDate,
  formatMoney,
  invoiceLabel,
  modeSlug,
} from "../customerPaymentTypes";

import type {
  CustomerPayment,
  OutstandingInvoice,
  CreatePaymentRequest,
  UpdatePaymentRequest,
} from "../customerPaymentTypes";

import PaymentDrawer from "../components/PaymentDrawer";

import "../CustomerPayments.css";

const PAGE_SIZE = 10;

interface ToastState {
  type: "success" | "error";
  text: string;
}

// Convert Axios errors into readable messages
const getApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
            error?: string;
            detail?: unknown;
          };
        };
      }
    ).response;

    const data = response?.data;

    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.detail === "string") return data.detail;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export default function CustomerPayments() {
  // -------------------------------
  // STATE
  // -------------------------------

  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);

  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<CustomerPayment | null>(null);

  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [toast, setToast] = useState<ToastState | null>(null);

  const toastTimer = useRef<number | undefined>(undefined);

  // -------------------------------
  // TOAST NOTIFICATION
  // -------------------------------

  const showToast = (
    type: ToastState["type"],
    text: string
  ) => {
    window.clearTimeout(toastTimer.current);

    setToast({ type, text });

    toastTimer.current = window.setTimeout(() => {
      setToast(null);
    }, 3400);
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  // -------------------------------
  // LOAD PAYMENTS AND INVOICES
  // -------------------------------

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setInvoicesLoading(true);
      setLoadError("");

      const [paymentData, invoiceData] = await Promise.all([
        customerPaymentApi.getAll(),
        customerPaymentApi.getOutstandingInvoices(),
      ]);

      setPayments(paymentData);
      setInvoices(invoiceData);

    } catch (error) {
      console.error("Failed to load customer payments:", error);

      setLoadError(
        getApiErrorMessage(
          error,
          "Unable to load customer payments."
        )
      );

    } finally {
      setLoading(false);
      setInvoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // -------------------------------
  // SORT PAYMENTS
  // Newest receipts first
  // -------------------------------

  const sorted = useMemo(
    () =>
      [...payments].sort(
        (a, b) =>
          new Date(b.receiptDate).getTime() -
          new Date(a.receiptDate).getTime()
      ),
    [payments]
  );

  // -------------------------------
  // SEARCH AND FILTER
  // -------------------------------

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return sorted.filter((p) => {
      const matchesSearch =
        !q ||
        (p.receiptNumber ?? "").toLowerCase().includes(q) ||
        invoiceLabel(p.serviceBill).toLowerCase().includes(q) ||
        (p.transactionReference ?? "").toLowerCase().includes(q) ||
        (p.depositedBank ?? "").toLowerCase().includes(q);

      const matchesMode =
        modeFilter === "all" ||
        p.paymentMode === modeFilter;

      return matchesSearch && matchesMode;
    });
  }, [sorted, search, modeFilter]);

  // -------------------------------
  // SUMMARY CARDS
  // -------------------------------

  const totalReceived = payments.reduce(
    (sum, p) => sum + Number(p.paymentAmount || 0),
    0
  );

  const totalOutstanding = invoices.reduce(
    (sum, i) => sum + Number(i.outstandingAmount || 0),
    0
  );

  // -------------------------------
  // PAGINATION
  // -------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const startItem =
    filtered.length === 0
      ? 0
      : (safePage - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(
    safePage * PAGE_SIZE,
    filtered.length
  );

  // -------------------------------
  // NEXT RECEIPT NUMBER
  // -------------------------------

  const nextReceiptNumber = `REC-${new Date().getFullYear()}-${String(
    payments.length + 1
  ).padStart(3, "0")}`;

  // -------------------------------
  // DRAWER ACTIONS
  // -------------------------------

  const openCreate = () => {
    setSelected(null);
    setFormError("");
    setDrawerOpen(true);
  };

  const openEdit = (payment: CustomerPayment) => {
    setSelected(payment);
    setFormError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
    setFormError("");
  };

  // -------------------------------
  // CREATE / UPDATE PAYMENT
  // -------------------------------

  const handleSubmit = async (
    data: CreatePaymentRequest | UpdatePaymentRequest
  ) => {
    try {
      setFormError("");
      setSaving(true);

      if (selected) {
        await customerPaymentApi.update(
          selected._id,
          data as UpdatePaymentRequest
        );

        showToast(
          "success",
          "Payment updated successfully"
        );

      } else {
        await customerPaymentApi.create(
          data as CreatePaymentRequest
        );

        setCurrentPage(1);

        showToast(
          "success",
          "Payment receipt saved successfully"
        );
      }

      closeDrawer();

      // Refresh payment list and outstanding invoices
      await load();

    } catch (error) {
      console.error("Payment save failed:", error);

      setFormError(
        getApiErrorMessage(
          error,
          "Could not save the payment. Please try again."
        )
      );

    } finally {
      setSaving(false);
    }
  };

  // -------------------------------
  // LOADING STATE
  // -------------------------------

  if (loading) {
    return (
      <div className="cp-state">
        Loading payments...
      </div>
    );
  }

  // -------------------------------
  // ERROR STATE
  // -------------------------------

  if (loadError) {
    return (
      <div className="cp-state cp-state--error">
        <h2>Unable to load payments</h2>

        <p>{loadError}</p>

        <button
          type="button"
          className="cp-btn cp-btn--primary"
          onClick={load}
        >
          Try again
        </button>
      </div>
    );
  }

  // -------------------------------
  // MAIN UI
  // -------------------------------

  return (
    <div className="cp-page">

      {/* Header */}
      <div className="cp-header">
        <div>
          <h1>Customer Payments</h1>
          <p>
            Receipts received against approved service invoices
          </p>
        </div>

        <button
          type="button"
          className="cp-btn cp-btn--primary"
          onClick={openCreate}
        >
          + New receipt
        </button>
      </div>

      {/* Summary */}
      <div className="cp-stats">

        <div className="cp-stat">
          <span className="cp-stat__icon">₹</span>

          <div>
            <span>Total received</span>
            <strong>{formatMoney(totalReceived)}</strong>
          </div>
        </div>

        <div className="cp-stat">
          <span className="cp-stat__icon">#</span>

          <div>
            <span>Receipts</span>
            <strong>{payments.length}</strong>
          </div>
        </div>

        <div className="cp-stat cp-stat--accent">
          <span className="cp-stat__icon">!</span>

          <div>
            <span>
              Outstanding · {invoices.length} invoice
              {invoices.length === 1 ? "" : "s"}
            </span>

            <strong>
              {formatMoney(totalOutstanding)}
            </strong>
          </div>
        </div>

      </div>

      {/* Payment List */}
      <section className="cp-card">

        {/* Search and Filter */}
        <div className="cp-toolbar">

          <input
            type="search"
            placeholder="Search receipt, invoice, reference or bank"
            aria-label="Search payments"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />

          <select
            aria-label="Filter by payment mode"
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All modes</option>

            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>

        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="cp-empty">
            <strong>No payments found</strong>

            <p>
              Try a different search, or record a new receipt.
            </p>
          </div>
        ) : (

          /* Payment Table */
          <div className="cp-table-wrap">

            <table className="cp-table">

              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Invoice</th>
                  <th>Mode</th>
                  <th>Reference / Bank</th>
                  <th className="cp-right">Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {pageItems.map((p) => (
                  <tr key={p._id}>

                    <td>
                      <div className="cp-receipt">
                        {p.receiptNumber}
                      </div>

                      <div className="cp-muted">
                        {formatDate(p.receiptDate)}
                      </div>
                    </td>

                    <td>
                      {invoiceLabel(p.serviceBill)}
                    </td>

                    <td>
                      <span
                        className={`cp-mode cp-mode--${modeSlug(
                          p.paymentMode
                        )}`}
                      >
                        {p.paymentMode}
                      </span>
                    </td>

                    <td>
                      <div>
                        {p.transactionReference || "-"}
                      </div>

                      <div className="cp-muted">
                        {p.depositedBank || "-"}
                      </div>
                    </td>

                    <td className="cp-right cp-amount">
                      {formatMoney(p.paymentAmount)}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="cp-icon-btn"
                        onClick={() => openEdit(p)}
                        title="Edit payment"
                        aria-label={`Edit ${p.receiptNumber}`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

        {/* Pagination */}
        <div className="cp-pagination">

          <span>
            Showing {startItem}-{endItem} of {filtered.length} receipts
          </span>

          <div className="cp-pages">

            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage(safePage - 1)}
            >
              Previous
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => i + 1
            ).map((page) => (
              <button
                type="button"
                key={page}
                className={
                  page === safePage ? "is-active" : ""
                }
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage(safePage + 1)}
            >
              Next
            </button>

          </div>
        </div>

      </section>

      {/* Payment Drawer */}
      <PaymentDrawer
        open={drawerOpen}
        payment={selected}
        invoices={invoices}
        invoicesLoading={invoicesLoading}
        nextReceiptNumber={nextReceiptNumber}
        saving={saving}
        serverError={formError}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`cp-toast cp-toast--${toast.type}`}
        >
          {toast.text}
        </div>
      )}

    </div>
  );
}
