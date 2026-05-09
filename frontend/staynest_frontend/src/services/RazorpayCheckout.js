// import { simulatePaymentSuccess } from "../services/paymentService";


/*
export const openMockCheckout = async (order, onSuccess) => {

  const confirmPay = window.confirm(
    `StayNest Payment\n\nAmount: ₹${order.amount}\n\nProceed with payment?`
  );

  if (!confirmPay) return;

  try {

    await simulatePaymentSuccess(order.order_id, order.amount);

    onSuccess();

  } catch (err) {
    console.error(err);
    alert("Payment simulation failed");
  }

};
*/



/* REAL RAZORPAY VERSION (FOR FUTURE) */


export const openRealCheckout = (order, onSuccess, user = null) => {

  const options = {
    key: order.razorpay_key,
    amount: Math.round(parseFloat(order.amount) * 100),
    currency: "INR",
    name: "StayNest",
    description: "Booking Payment",
    order_id: order.order_id,

    prefill: {
      name: user?.full_name || "",
      email: user?.email || "",
      contact: user?.phone || "",
    },

    handler: function (response) {
      onSuccess();
    },

    theme: {
      color: "#0d6efd"
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};



