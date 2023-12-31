import './CartScreen.css';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

// Components
import CartItem from '../components/CartItem';

// Actions
import { addToCart, removeFromCart } from '../redux/actions/cartActions';

const CartScreen = () => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;
  const navigate = useNavigate();

  const [selectedGateway, setSelectedGateway] = useState('stripe');

  const qtyChangeHandler = (id, qty) => {
    dispatch(addToCart(id, qty));
  };

  const removeHandler = (id) => {
    dispatch(removeFromCart(id));
  };

  const getCartCount = () => {
    return cartItems.reduce((qty, item) => Number(item.qty) + qty, 0);
  };

  const getCartSubTotal = () => {
    return cartItems.reduce((price, item) => item.price * item.qty + price, 0);
  };

  const makePayment = async () => {
    if (selectedGateway === 'stripe') {
      // Stripe payment logic here
      const stripe = await loadStripe('pk_test_51Ns9obAuazamskfxFgZzz5Z9X2tDM9NDLLI0Wserb178ONKNbJ8hnbb7a9AqqCgEd0PTJDxKKYgUZDwnMy6skPcM00LieKKLAa');
      
      const body = {
        products: cartItems,
      };

      const headers = {
        'Content-Type': 'application/json',
      };

      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const session = await response.json();

          const result = await stripe.redirectToCheckout({
            sessionId: session.id,
          });

          if (result.error) {
            alert(result.error.message);
          }
        } else {
          throw new Error('Failed to create checkout session');
        }
      } catch (error) {
        console.error(error);
        alert('An error occurred while processing your payment.');
      }
    } else {
      // Navigate to the custom payment gateway route
      navigate('/payment'); // Update the route as needed
    }
  };

  return (
    <div className="cartscreen">
      <div className="cartscreen__left">
        <h2>Shopping Cart</h2>
        {cartItems.length === 0 ? (
          <div>
            Your Cart is Empty <Link to="/home">Go Back</Link>
          </div>
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={item.product}
              item={item}
              qtyChangeHandler={qtyChangeHandler}
              removeHandler={removeHandler}
            />
          ))
        )}
      </div>
      <div className="cartscreen__right">
        <div className="cartscreen__info">
          <p>Subtotal ({getCartCount()}) items</p>
          <p>Rs.{getCartSubTotal().toFixed(2)}</p>
        </div>
        <div>
          <label htmlFor="paymentGateway">Select Payment Gateway:</label>
          <select
            id="paymentGateway"
            value={selectedGateway}
            onChange={(e) => setSelectedGateway(e.target.value)}
          >
            <option value="stripe">Pay with Stripe</option>
            <option value="custom">Pay with Custom Gateway</option>
          </select>
          <button onClick={makePayment}>Proceed To Checkout</button>
        </div>
      </div>
    </div>
  );
};

export default CartScreen;
