import { useState, useEffect } from "react";
import { MapPin, Phone, User, CreditCard, ArrowLeft, Truck, UtensilsCrossed, ShoppingBag, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { placeOrder, type Order, type BranchTable } from "@/services/api";
import { initializePaystackPayment, savePendingOrderId } from "@/services/paymentsApi";
import { LocationPicker } from "../auth/LocationPicker";
import { getSavedDeliveryLocation, saveDeliveryLocation } from "@/services/locationService";
import { useAuth } from "@/context/AuthContext";
import { formatOrderReference } from "@/utils/orderDisplay";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutProps {
  cart: CartItem[];
  branchId: string;
  branchName: string;
  branchAddress?: string;
  onPlaceOrder: (formData: OrderDetails, order: Order) => void;
  onGoBack: () => void;
  onChangeBranch?: () => void;
}

export interface OrderDetails {
  deliveryAddress: string;
  phoneNumber: string;
  customerName: string;
  paymentMethod: string;
  specialInstructions: string;
  subtotal: number;
  deliveryFee: number;
  reservationFee: number;
  total: number;
  orderType: 'delivery' | 'dine-in' | 'pickup';
}

export function Checkout({ cart, branchId, branchName, branchAddress, onPlaceOrder, onGoBack, onChangeBranch }: CheckoutProps) {
  const { user } = useAuth();

  const [orderType, setOrderType] = useState<'delivery' | 'dine-in' | 'pickup'>('delivery');
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem('foodchain_phone_number') || "");
  const [deliveryAddress, setDeliveryAddress] = useState(getSavedDeliveryLocation());
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [tables, setTables] = useState<BranchTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<BranchTable | null>(null);

  const RESERVATION_FEE = 500;

  const DEMO_TABLES: BranchTable[] = [
    { id: 't1', tableNumber: 1, capacity: 2, isAvailable: true },
    { id: 't2', tableNumber: 2, capacity: 4, isAvailable: true },
    { id: 't3', tableNumber: 3, capacity: 4, isAvailable: true },
    { id: 't4', tableNumber: 4, capacity: 6, isAvailable: true },
    { id: 't5', tableNumber: 5, capacity: 2, isAvailable: true },
    { id: 't6', tableNumber: 6, capacity: 8, isAvailable: true },
  ];

  useEffect(() => {
    if (orderType !== 'dine-in') return;
    setTablesLoading(true);
    setSelectedTable(null);
    setTimeout(() => {
      setTables(DEMO_TABLES);
      setTablesLoading(false);
    }, 600);
  }, [orderType, branchId]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? 500 : 0;
  const reservationFee = orderType === 'dine-in' && selectedTable ? RESERVATION_FEE : 0;
  const total = subtotal + deliveryFee + reservationFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // 'pickup' is a UI-only label — the backend receives 'takeaway' for this flow.
    const apiOrderType = orderType === 'pickup' ? 'takeaway' : orderType;
    // Card payments go through Paystack; cash/transfer go directly to the kitchen.
    const apiPaymentMethod = paymentMethod === 'card' ? 'PAYSTACK' : paymentMethod;

    const payload = {
      branchId,
      branchName,
      orderType: apiOrderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      tableNumber: orderType === 'dine-in' && selectedTable ? String(selectedTable.tableNumber) : undefined,
      items: cart.map(item => ({
        menuItemId: item.id,
        menuItemName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      customerName,
      phoneNumber,
      paymentMethod: apiPaymentMethod,
      specialInstructions,
    };

    try {
      const order = await placeOrder(payload);
      if (orderType === 'delivery') saveDeliveryLocation(deliveryAddress);

      if (apiPaymentMethod === 'PAYSTACK') {
        // Paystack flow: initialize payment then redirect to checkout page
        const paymentInit = await initializePaystackPayment({
          orderId: order.id,
          email: user?.email ?? '',
          amount: total,
        });
        savePendingOrderId(order.id);
        // Hard redirect — Paystack will redirect back to PAYSTACK_CALLBACK_URL
        window.location.href = paymentInit.authorizationUrl;
      } else {
        // Cash / transfer: order enters kitchen immediately
        const formData: OrderDetails = {
          customerName,
          phoneNumber,
          deliveryAddress: orderType === 'delivery' ? deliveryAddress : '',
          paymentMethod,
          specialInstructions,
          subtotal,
          deliveryFee,
          reservationFee,
          total,
          orderType,
        };
        onPlaceOrder(formData, order);
        toast.success("Order placed successfully!", { description: `Order ${formatOrderReference(order.id)}` });
      }
    } catch {
      toast.error("Failed to place order", { description: "Please try again" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onGoBack}
            className="p-2 rounded-md hover:bg-[var(--espresso)]/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: "var(--espresso)" }} />
          </button>
          <h1
            className="text-2xl sm:text-3xl"
            style={{ color: "var(--espresso)", fontWeight: 600 }}
          >
            Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Order Type */}
              <Card
                className="border-[var(--espresso)]/10"
                style={{ backgroundColor: "var(--white)" }}
              >
                <CardHeader>
                  <CardTitle style={{ color: "var(--espresso)" }}>
                    Order Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'delivery' as const, label: 'Delivery', sub: 'Order delivered to you', Icon: Truck },
                      { value: 'pickup' as const,   label: 'Pickup',   sub: 'Collect from branch',   Icon: ShoppingBag },
                      { value: 'dine-in' as const,  label: 'Dine In',  sub: 'Eat at the restaurant', Icon: UtensilsCrossed },
                    ]).map(({ value, label, sub, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setOrderType(value)}
                        className="p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all text-center"
                        style={{
                          borderColor: orderType === value ? 'var(--golden-amber)' : 'rgba(59,35,20,0.1)',
                          backgroundColor: orderType === value ? 'rgba(240,165,0,0.08)' : 'transparent',
                        }}
                      >
                        <Icon
                          className="w-6 h-6"
                          style={{
                            color: orderType === value ? 'var(--golden-amber)' : 'var(--espresso)',
                            opacity: orderType === value ? 1 : 0.45,
                          }}
                        />
                        <span className="text-sm" style={{ color: 'var(--espresso)', fontWeight: 600 }}>{label}</span>
                        <span className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.6 }}>{sub}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card
                className="border-[var(--espresso)]/10"
                style={{ backgroundColor: "var(--white)" }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "var(--espresso)" }}
                  >
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" style={{ color: "var(--espresso)" }}>
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="border-[var(--espresso)]/20"
                      style={{ backgroundColor: "var(--white)" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" style={{ color: "var(--espresso)" }}>
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                        style={{ color: "var(--espresso)", opacity: 0.4 }}
                      />
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="080 1234 5678"
                        required
                        className="pl-10 border-[var(--espresso)]/20"
                        style={{ backgroundColor: "var(--white)" }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              {orderType === 'delivery' && (
                <Card
                  className="border-[var(--espresso)]/10"
                  style={{ backgroundColor: "var(--white)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="flex items-center gap-2"
                      style={{ color: "var(--espresso)" }}
                    >
                      <MapPin className="w-5 h-5" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LocationPicker
                      value={deliveryAddress}
                      onChange={setDeliveryAddress}
                      placeholder="Search for your delivery address…"
                    />
                    <div
                      className="flex items-center justify-between p-3 rounded-md"
                      style={{ backgroundColor: "rgba(240,165,0,0.08)" }}
                    >
                      <p className="text-sm" style={{ color: "var(--espresso)" }}>
                        Delivering from{" "}
                        <span style={{ fontWeight: 600 }}>{branchName}</span>
                      </p>
                      {onChangeBranch && (
                        <button
                          type="button"
                          onClick={onChangeBranch}
                          className="text-xs underline ml-3 flex-shrink-0"
                          style={{ color: "var(--golden-amber)" }}
                        >
                          Change
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={() => {}}
                      required
                      className="sr-only"
                      aria-hidden="true"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Pickup Details */}
              {orderType === 'pickup' && (
                <Card
                  className="border-[var(--espresso)]/10"
                  style={{ backgroundColor: "var(--white)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="flex items-center gap-2"
                      style={{ color: "var(--espresso)" }}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Pickup Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className="flex items-center justify-between p-3 rounded-md"
                      style={{ backgroundColor: "rgba(240,165,0,0.08)" }}
                    >
                      <p className="text-sm" style={{ color: "var(--espresso)", fontWeight: 600 }}>
                        You're picking up at {branchName}!
                      </p>
                      {onChangeBranch && (
                        <button
                          type="button"
                          onClick={onChangeBranch}
                          className="text-xs underline ml-3 flex-shrink-0"
                          style={{ color: "var(--golden-amber)" }}
                        >
                          Change branch
                        </button>
                      )}
                    </div>
                    {/* Google Maps embed — requires VITE_GOOGLE_MAPS_API_KEY env var */}
                    <iframe
                      title="Branch location"
                      src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''}&q=${encodeURIComponent(branchAddress ?? branchName)}`}
                      style={{ width: '100%', height: '220px', border: 0, borderRadius: '8px' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Dine-In — Table Reservation */}
              {orderType === 'dine-in' && (
                <Card
                  className="border-[var(--espresso)]/10"
                  style={{ backgroundColor: "var(--white)" }}
                >
                  <CardHeader>
                    <CardTitle
                      className="flex items-center gap-2"
                      style={{ color: "var(--espresso)" }}
                    >
                      <UtensilsCrossed className="w-5 h-5" />
                      Reserve a Table
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tablesLoading ? (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--espresso)', opacity: 0.5 }}>
                        Loading available tables…
                      </p>
                    ) : tables.length === 0 ? (
                      <div
                        className="p-4 rounded-md text-center"
                        style={{ backgroundColor: 'rgba(232,98,42,0.08)' }}
                      >
                        <p className="text-sm" style={{ color: 'var(--burnt-orange)', fontWeight: 600 }}>
                          No tables are currently available at this branch.
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                          Try again later or choose Pickup or Delivery instead.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tables.map(table => {
                          const isSelected = selectedTable?.id === table.id;
                          return (
                            <button
                              key={table.id}
                              type="button"
                              onClick={() => setSelectedTable(isSelected ? null : table)}
                              className="w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left"
                              style={{
                                borderColor: isSelected ? 'var(--golden-amber)' : 'rgba(59,35,20,0.1)',
                                backgroundColor: isSelected ? 'rgba(240,165,0,0.08)' : 'transparent',
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                                  style={{
                                    backgroundColor: isSelected ? 'var(--golden-amber)' : 'rgba(59,35,20,0.08)',
                                    color: isSelected ? 'var(--charcoal)' : 'var(--espresso)',
                                    fontWeight: 600,
                                  }}
                                >
                                  {table.tableNumber}
                                </div>
                                <div>
                                  <p className="text-sm" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                                    Table {table.tableNumber}
                                  </p>
                                  <p className="text-xs flex items-center gap-1" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                                    <Users className="w-3 h-3" />
                                    Seats {table.capacity}
                                  </p>
                                </div>
                              </div>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'var(--sage-green)', color: 'var(--white)' }}
                              >
                                Available
                              </span>
                            </button>
                          );
                        })}
                        {selectedTable && (
                          <p className="text-xs mt-2" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                            A reservation fee of ₦{RESERVATION_FEE.toLocaleString()} will be added to your total.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payment Method */}
              <Card
                className="border-[var(--espresso)]/10"
                style={{ backgroundColor: "var(--white)" }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "var(--espresso)" }}
                  >
                    <CreditCard className="w-5 h-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    {[
                      { value: "card", label: "Card Payment" },
                      { value: "cash", label: (orderType === 'dine-in' || orderType === 'pickup') ? "Cash Payment" : "Cash on Delivery" },
                      { value: "transfer", label: "Bank Transfer" },
                    ].map(opt => (
                      <div
                        key={opt.value}
                        className="flex items-center space-x-2 p-3 rounded-md border border-[var(--espresso)]/10 hover:bg-[var(--espresso)]/5 transition-colors"
                      >
                        <RadioGroupItem value={opt.value} id={opt.value} />
                        <Label
                          htmlFor={opt.value}
                          className="flex-1 cursor-pointer"
                          style={{ color: "var(--espresso)" }}
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <Card
                className="border-[var(--espresso)]/10"
                style={{ backgroundColor: "var(--white)" }}
              >
                <CardHeader>
                  <CardTitle style={{ color: "var(--espresso)" }}>
                    Special Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requests? (e.g., extra spicy, no onions)"
                    rows={3}
                    className="border-[var(--espresso)]/20 resize-none"
                    style={{ backgroundColor: "var(--white)" }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card
                className="border-[var(--espresso)]/10 sticky top-20"
                style={{ backgroundColor: "var(--white)" }}
              >
                <CardHeader>
                  <CardTitle style={{ color: "var(--espresso)" }}>
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span style={{ color: "var(--espresso)", opacity: 0.7 }}>
                          {item.name} × {item.quantity}
                        </span>
                        <span style={{ color: "var(--espresso)", fontWeight: 600 }}>
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedTable && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--espresso)", opacity: 0.7 }}>Reserved Table</span>
                        <span style={{ color: "var(--espresso)", fontWeight: 600 }}>
                          Table {selectedTable.tableNumber} (seats {selectedTable.capacity})
                        </span>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--espresso)", opacity: 0.7 }}>
                        Subtotal
                      </span>
                      <span style={{ color: "var(--espresso)", fontWeight: 600 }}>
                        ₦{subtotal.toLocaleString()}
                      </span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--espresso)", opacity: 0.7 }}>
                          Delivery Fee
                        </span>
                        <span style={{ color: "var(--espresso)", fontWeight: 600 }}>
                          ₦{deliveryFee.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {reservationFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--espresso)", opacity: 0.7 }}>
                          Reservation Fee
                        </span>
                        <span style={{ color: "var(--espresso)", fontWeight: 600 }}>
                          ₦{reservationFee.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg">
                    <span style={{ color: "var(--espresso)", fontWeight: 600 }}>
                      Total
                    </span>
                    <span style={{ color: "var(--golden-amber)", fontWeight: 600 }}>
                      ₦{total.toLocaleString()}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      isProcessing ||
                      (orderType === 'delivery' && !deliveryAddress.trim()) ||
                      (orderType === 'dine-in' && (tablesLoading || tables.length === 0 || !selectedTable))
                    }
                    className="w-full transition-all hover:opacity-90 hover:shadow-lg"
                    style={{
                      backgroundColor: "var(--golden-amber)",
                      color: "var(--charcoal)",
                    }}
                  >
                    {isProcessing
                    ? "Processing…"
                    : paymentMethod === 'card'
                      ? "Pay with Paystack"
                      : "Place Order"
                  }
                  </Button>
                  {orderType === 'delivery' && !deliveryAddress.trim() && (
                    <p className="text-xs text-center" style={{ color: "var(--espresso)", opacity: 0.5 }}>
                      Please enter a delivery address to continue
                    </p>
                  )}
                  {orderType === 'dine-in' && !tablesLoading && tables.length === 0 && (
                    <p className="text-xs text-center" style={{ color: 'var(--burnt-orange)', opacity: 0.8 }}>
                      No tables available — please choose another order type
                    </p>
                  )}
                  {orderType === 'dine-in' && !tablesLoading && tables.length > 0 && !selectedTable && (
                    <p className="text-xs text-center" style={{ color: "var(--espresso)", opacity: 0.5 }}>
                      Please select a table to continue
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
