import React, { useState, useEffect } from "react";
import Layout from "../layout";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import Separator from "../../../components/ui/Separator";
import { Trash } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios for API calls

export const ItemCard = ({ itemName, img, onClick }) => {
  return (
    <div className="cursor-pointer" onClick={onClick}>
      <img
        src={img}
        alt={itemName}
        className="w-32 h-32 object-cover rounded-lg"
      />
      <p className="text-center mt-2">{itemName}</p>
    </div>
  );
};

const CreateOrder = () => {
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [username, setUsername] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [errorMessage, setErrorMessage] = useState('');
  const [products, setProducts] = useState([]); // State to store products
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Fetch products from the server
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products");
        const formattedProducts = response.data.map(product => ({
          ...product,
          Price: parseFloat(product.Price) // Ensure Price is a number
        }));
        setProducts(formattedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const cookies = products.filter(product => product.CategoryID === 1);
  const bars = products.filter(product => product.CategoryID === 2);
  const bread = products.filter(product => product.CategoryID === 3);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.ProductID === product.ProductID
      );
      if (existingItem) {
        return prevItems.map((item) =>
          item.ProductID === product.ProductID
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productID) => {
    setCartItems((prevItems) => {
      return prevItems.filter((item) => item.ProductID !== productID);
    });
  };

  // Calculate subtotal, discount, and total
  const subtotal = cartItems.reduce((total, item) => total + item.quantity * item.Price, 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal - discountAmount;
  const amountPaidValue = parseFloat(amountPaid) || 0;
  const change = amountPaidValue - total;

  const handleCheckout = async () => {
    // Validation
    if (cartItems.length === 0) {
      setErrorMessage("Please add items to cart before checkout");
      return;
    }

    if (amountPaidValue < total) {
      setErrorMessage("Amount paid is less than the total amount");
      return;
    }

    try {
      // Fetch employeeID based on username
      const employeeResponse = await axios.get(`http://localhost:5000/api/employees?username=${username}`);
      const employeeID = employeeResponse.data.EmployeeID;

      if (!employeeID) {
        setErrorMessage("Employee not found");
        return;
      }

      // Fetch the top value of scheduleID
      const scheduleResponse = await axios.get("http://localhost:5000/api/schedule/top");
      const scheduleID = scheduleResponse.data.ScheduleID;

      // Calculate the total discount
      const discountAmount = parseFloat(discount) || 0;

      // Prepare transaction data
      const transactionData = {
        EmployeeID: employeeID,
        ScheduleID: scheduleID,
        TotalCost: subtotal,
        DiscountedPrice: discountAmount,
        TransactionDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        CashPayment: amountPaidValue,
        items: cartItems.map(item => ({
          ProductID: item.ProductID,
          quantity: item.quantity,
          Price: item.Price
        }))
      };

      // Log the transaction data
      console.log('Sending transaction data:', transactionData);

      // Save transaction to the database
      const transactionResponse = await axios.post("http://localhost:5000/api/transactions", transactionData);
      const transactionID = transactionResponse.data.TransactionID;

      setErrorMessage("");
      navigate("/admin/create-order/checkout/", {
        state: {
          cartItems,
          totalAmount: subtotal,
          cashReceived: amountPaidValue,
          transactionID,
          employeeID,
          discountAmount
        }
      });
    } catch (error) {
      console.error("Error during checkout:", error);
      setErrorMessage("Checkout failed. Please try again.");
    }
  };

  return (
    <Layout>
      <section className="h-full flex flex-col">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-blueSerenity py-2 text-right md:text-left w-full">
            Hello, {username}
          </h1>

          <div className="flex items-center relative w-full md:w-[44rem]">
            <MagnifyingGlass
              size={24}
              className="absolute left-3 text-darkGray"
            />
            <input
              className="w-full md:w-full pl-10 py-2 border rounded-md text-sm text-left text-black placeholder:text-darkGray"
              placeholder="Search by name or product number"
            />
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage("")} 
            className="p-1 w-6 h-6 flex items-center justify-center rounded"
          >
            <X size={16} />
          </button>
        </div>
      )}


        <div className="flex flex-col md:flex-row gap-4 md:gap-8 h-full overflow-y-auto md:overflow-y-hidden">
          <div className="bg-solidWhite flex rounded-lg shadow-lg p-5 max-h-full h-full flex-col overflow-y-scroll w-full">
            {/* Cookies Section  */}
            <div className="w-full">
              <h2>Cookies</h2>

              <div className="flex flex-wrap grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cookies.map((item) => (
                  <div
                    key={item.ProductID}
                    className="cursor-pointer flex flex-col items-center max-w-[8rem] w-32 h-32 p-3 border bg-arcLight hover:scale-105 transition-all duration-200 text-darkerGray shadow-lg rounded-lg justify-center gap-1"
                    onClick={() => addToCart(item)}
                  >
                    <p className="text-center text-xs sm:text-sm break-words font-semibold">
                      {item.ProductName}
                    </p>
                    <span className="text-xs sm:text-sm">
                      P {item.Price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bars Section */}
            <div className="w-full">
              <h2>Bars</h2>
              <div className="flex flex-wrap grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {bars.map((item) => (
                  <div
                    key={item.ProductID}
                    className="cursor-pointer flex flex-col items-center max-w-[8rem] w-32 h-32 p-3 border bg-arcLight hover:scale-105 transition-all duration-200 text-darkerGray shadow-lg rounded-lg justify-center gap-1"
                    onClick={() => addToCart(item)}
                  >
                    <p className="text-center text-xs sm:text-sm break-words font-semibold">
                      {item.ProductName}
                    </p>
                    <span className="text-xs sm:text-sm">
                      P {item.Price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bread Section */}
            <div className="w-full">
              <h2>Bread</h2>
              <div className="flex flex-wrap grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {bread.map((item) => (
                  <div
                    key={item.ProductID}
                    className="cursor-pointer flex flex-col items-center max-w-[8rem] w-32 h-32 p-3 border bg-arcLight hover:scale-105 transition-all duration-200 text-darkerGray shadow-lg rounded-lg justify-center gap-1"
                    onClick={() => addToCart(item)}
                  >
                    <p className="text-center text-xs sm:text-sm break-words font-semibold">
                      {item.ProductName}
                    </p>
                    <span className="text-xs sm:text-sm">
                      P {item.Price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 md:p-10 bg-solidWhite rounded-lg shadow-lg w-full sm:w-[80%] md:w-[50%] lg:w-[35%] h-full flex flex-col">
            <h2>Cart</h2>
            <Separator />

            {/* Scrollable Cart Section */}
            <div className="w-full overflow-x-auto max-h-[25rem] flex-grow">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Product</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Subtotal</th>
                    <th className="p-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.ProductID} className="hover:bg-gray-50">
                      <td className="p-2">{item.ProductName}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">
                        P {(item.quantity * item.Price).toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          className="text-white bg-red/70 hover:bg-red text-sm px-2 py-1 rounded-lg w-fit"
                          onClick={() => removeFromCart(item.ProductID)}
                        >
                          <Trash size={32} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex w-full justify-between px-2 py-2">
              <label className="font-semibold">Subtotal</label>
              <label className="font-semibold">
                P {subtotal.toFixed(2)}
              </label>
            </div>
            <Separator />

            {/* Payment Details */}
            <div className="flex flex-col gap-2">
              <div className="flex w-full justify-between px-2 py-2 items-center">
                <label className="font-semibold">Discount</label>
                <input
                  className="w-[10rem] text-left pl-3 text-black placeholder:text-darkerGray"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(
                      /[^0-9.]/g,
                      ""
                    );
                  }}
                />
              </div>

              <div className="flex w-full justify-between px-2 py-2 items-center">
                <label className="font-semibold">Final Total</label>
                <label className="font-semibold w-[10rem] text-right">
                  P {total.toFixed(2)}
                </label>
              </div>

              <div className="flex w-full justify-between px-2 py-2 items-center">
                <label className="font-semibold">Amount Paid</label>
                <input
                  className="w-[10rem] text-left pl-3 text-black placeholder:text-darkerGray"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(
                      /[^0-9.]/g,
                      ""
                    );
                  }}
                />
              </div>

              <div className="flex w-full justify-between px-2 py-2 items-center">
                <label className="font-semibold">Change</label>
                <label className="font-semibold w-[10rem] text-right">
                  P {change > 0 ? change.toFixed(2) : '0.00'}
                </label>
              </div>

              <div className="flex w-full justify-between px-2 py-2 items-center">
                <label className="font-semibold">Mode of Payment</label>
                <select 
                  className="w-[10rem]"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option>Cash</option>
                  <option>Digital Wallet</option>
                </select>
              </div>
            </div>

            {/* Checkout Button Aligned to Bottom */}
            <div className="mt-auto flex justify-center">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:scale-105 transition-all duration-200"
                onClick={handleCheckout}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout> 
  );
};

export default CreateOrder;