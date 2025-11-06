import { useEffect } from "react";
import http from "../../api/http";
import { useChatStore } from "../../store/useChatStore";

const Card = ({ title, children }) => (
  <div className="p-4 border-b last:border-b-0">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
    <div className="mt-2 text-sm">{children}</div>
  </div>
);

export default function CustomerPanel() {
  const { activeId, conversations, customer, setCustomer } = useChatStore((s) => ({
    activeId: s.activeId,
    conversations: s.conversations,
    customer: s.customer,
    setCustomer: s.setCustomer,
  }));

  useEffect(() => {
    if (!activeId) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;
    http.get(`/support/customers/${conv.customerId}/context`).then((r) => setCustomer(r.data));
  }, [activeId, conversations, setCustomer]);

  if (!customer)
    return <div className="p-4 text-sm text-slate-500">Select a conversation to load customer details.</div>;

  return (
    <div className="bg-white/80 backdrop-blur rounded-xl">
      <Card title="Profile">
        <div className="font-medium">{customer.profile?.name}</div>
        <div className="text-slate-600">{customer.profile?.email}</div>
      </Card>
      <Card title="Latest Order">
        <div>
          Order ID: <span className="font-medium">{customer.orders?.[0]?.id || "—"}</span>
        </div>
        <div>
          Status: <span className="font-medium">{customer.orders?.[0]?.status || "—"}</span>
        </div>
        <div>Total: ₺{customer.orders?.[0]?.total ?? "—"}</div>
      </Card>
      <Card title="Cart">
        <div>{customer.cart?.items?.length ?? 0} item(s)</div>
        <div>Subtotal: ₺{customer.cart?.subtotal ?? 0}</div>
      </Card>
    </div>
  );
}