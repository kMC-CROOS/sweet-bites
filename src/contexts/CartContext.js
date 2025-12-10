import React, { createContext, useContext, useEffect, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  console.log('🔄 cartReducer called with action:', action.type, action.payload);
  console.log('🔄 current state.items:', state.items);
  console.log('🔄 current state.items.length:', state.items.length);

  switch (action.type) {
    case 'ADD_ITEM':
      console.log('🔄 ADD_ITEM processing...');
      const existingItem = state.items.find(item =>
        item.id === action.payload.id &&
        JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations)
      );
      console.log('🔄 existingItem found:', existingItem);

      if (existingItem) {
        console.log('🔄 Updating existing item quantity');
        const newState = {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id &&
              JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations)
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
        console.log('🔄 New state after update:', newState);
        return newState;
      }
      console.log('🔄 Adding new item to cart');
      const newState = {
        ...state,
        items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }]
      };
      console.log('🔄 New state after add:', newState);
      return newState;

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.cartItemId === action.payload.cartItemId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.cartItemId !== action.payload)
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: []
  });

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('sweetbite-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('sweetbite-cart');
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('sweetbite-cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (item, quantity = 1) => {
    console.log('🛒 addItem called with:', item, 'quantity:', quantity);

    // Validate item
    if (!item) {
      console.error('❌ addItem: item is null or undefined');
      return;
    }

    if (!item.id) {
      console.error('❌ addItem: item.id is missing');
      return;
    }

    if (!item.price) {
      console.error('❌ addItem: item.price is missing');
      return;
    }

    const cartItemId = `${item.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payload = {
      ...item,
      quantity,
      cartItemId
    };
    console.log('🛒 addItem payload:', payload);

    try {
      dispatch({
        type: 'ADD_ITEM',
        payload: payload
      });
      console.log('🛒 addItem dispatch completed successfully');
    } catch (error) {
      console.error('❌ Error in addItem dispatch:', error);
    }
  };

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity > 0) {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { cartItemId, quantity } });
    } else {
      removeItem(cartItemId);
    }
  };

  const removeItem = (cartItemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: cartItemId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartItems = () => {
    return state.items;
  };

  return (
    <CartContext.Provider value={{
      cartItems: state.items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getCartTotal,
      getItemCount,
      getCartItems
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
