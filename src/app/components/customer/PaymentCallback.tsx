import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  verifyPaystackPayment,
  getPendingOrderId,
  clearPendingOrderId,
  type VerifyPaymentResponse,
} from "@/services/paymentsApi";

type VerifyState = "verifying" | "success" | "failed" | "error";

export function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get("reference") ?? "";

  const [state, setState] = useState<VerifyState>("verifying");
  const [result, setResult] = useState<VerifyPaymentResponse | null>(null);
  const [hasCalled, setHasCalled] = useState(false);

  useEffect(() => {
    if (!reference) {
      setState("error");
      return;
    }

    // Guard against duplicate calls (e.g. StrictMode double-invoke)
    if (hasCalled) return;
    setHasCalled(true);

    verifyPaystackPayment(reference)
      .then((res) => {
        setResult(res);
        if (res.success) {
          setState("success");
          clearPendingOrderId();
          toast.success("Payment confirmed!", {
            description: "Your order is now being prepared.",
          });
        } else {
          setState("failed");
          toast.error("Payment was not successful", {
            description: res.message,
          });
        }
      })
      .catch(() => {
        setState("error");
        toast.error("Could not verify payment", {
          description: "Please contact support if your card was charged.",
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const handleTrackOrder = () => {
    const orderId = result?.orderId ?? getPendingOrderId();
    if (orderId) {
      sessionStorage.setItem("foodchain_tracking_order_id", orderId);
    }
    navigate("/order-tracker");
  };

  const handleRetry = () => {
    // Return to checkout — the pending order is still in PAYMENT_PENDING state
    navigate("/checkout");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center shadow-sm border"
        style={{
          backgroundColor: "var(--white)",
          borderColor: "var(--espresso)",
          borderOpacity: 0.1,
        }}
      >
        {state === "verifying" && (
          <>
            <Loader2
              className="w-16 h-16 mx-auto mb-4 animate-spin"
              style={{ color: "var(--golden-amber)" }}
            />
            <h2 className="text-2xl mb-2" style={{ color: "var(--espresso)", fontWeight: 600 }}>
              Verifying payment…
            </h2>
            <p className="text-sm" style={{ color: "var(--espresso)", opacity: 0.6 }}>
              Please wait while we confirm your payment with Paystack.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: "var(--sage-green)" }}
            />
            <h2 className="text-2xl mb-2" style={{ color: "var(--espresso)", fontWeight: 600 }}>
              Payment successful!
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--espresso)", opacity: 0.7 }}>
              {result?.message ?? "Your order has been confirmed and sent to the kitchen."}
            </p>
            <Button
              className="w-full transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--golden-amber)", color: "var(--charcoal)" }}
              onClick={handleTrackOrder}
            >
              Track my order
            </Button>
          </>
        )}

        {(state === "failed" || state === "error") && (
          <>
            <XCircle
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: "var(--burnt-orange)" }}
            />
            <h2 className="text-2xl mb-2" style={{ color: "var(--espresso)", fontWeight: 600 }}>
              {state === "error" ? "Verification failed" : "Payment unsuccessful"}
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--espresso)", opacity: 0.7 }}>
              {state === "error"
                ? "We could not verify your payment. If your card was charged, please contact support."
                : (result?.message ?? "Your payment was not completed. You can try again.")}
            </p>
            <div className="space-y-3">
              <Button
                className="w-full transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--golden-amber)", color: "var(--charcoal)" }}
                onClick={handleRetry}
              >
                Try again
              </Button>
              <Button
                variant="outline"
                className="w-full"
                style={{ borderColor: "var(--espresso)", color: "var(--espresso)", opacity: 0.7 }}
                onClick={() => navigate("/menu")}
              >
                Back to menu
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
