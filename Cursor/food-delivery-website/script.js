
document.addEventListener('DOMContentLoaded', () => {
    // Function to get cart from localStorage
    const getCart = () => {
        const cart = localStorage.getItem('foodDeliveryCart');
        return cart ? JSON.parse(cart) : [];
    };

    // Function to save cart to localStorage
    const saveCart = (cart) => {
        localStorage.setItem('foodDeliveryCart', JSON.stringify(cart));
    };

    // Function to add item to cart
    const addToCart = (item) => {
        const cart = getCart();
        const existingItem = cart.find(cartItem => cartItem.id === item.id);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        saveCart(cart);
        updateCartDisplay();
        alert(`${item.name} added to cart!`);
    };

    // Function to update cart display (for cart.html)
    const updateCartDisplay = () => {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalSpan = document.getElementById('cart-total');
        const cart = getCart();

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = ''; // Clear previous items
            let total = 0;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
                if (document.getElementById('checkout-button')) {
                    document.getElementById('checkout-button').disabled = true;
                }
            } else {
                cart.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('cart-item');
                    itemElement.innerHTML = `
                        <span>${item.name} x ${item.quantity}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        <button class="remove-from-cart" data-item-id="${item.id}">Remove</button>
                    `;
                    cartItemsContainer.appendChild(itemElement);
                    total += item.price * item.quantity;
                });
                if (document.getElementById('checkout-button')) {
                    document.getElementById('checkout-button').disabled = false;
                }
            }
            if (cartTotalSpan) {
                cartTotalSpan.textContent = total.toFixed(2);
            }
        }
    };

    // Event listeners for "Add to Cart" buttons on menu.html
    if (document.querySelector('#menu-items')) {
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (event) => {
                const item = {
                    id: event.target.dataset.itemId,
                    name: event.target.dataset.itemName,
                    price: parseFloat(event.target.dataset.itemPrice)
                };
                addToCart(item);
            });
        });

        // Set restaurant name on menu.html based on URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const restaurantNameParam = urlParams.get('restaurant');
        if (restaurantNameParam) {
            const restaurantNameElement = document.getElementById('restaurant-name');
            if (restaurantNameElement) {
                // Simple capitalization for display, in a real app you'd fetch details
                restaurantNameElement.textContent = restaurantNameParam.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Menu';
            }
        }
    }

    // Event listener for "Remove from Cart" buttons on cart.html
    if (document.querySelector('#cart')) {
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-from-cart')) {
                const itemId = event.target.dataset.itemId;
                let cart = getCart();
                cart = cart.filter(item => item.id !== itemId); // Remove the item completely
                saveCart(cart);
                updateCartDisplay();
            }
        });
        updateCartDisplay(); // Initial display when cart.html loads
    }

    // Login/Signup form submission (placeholder)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Login functionality is not fully implemented yet.');
            // Here you would send data to a backend for authentication
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Signup functionality is not fully implemented yet.');
            // Here you would send data to a backend to register a new user
        });
    }

    // Checkout button on cart.html
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            // In a real app, this would lead to a checkout process
            // For now, let's just clear the cart and redirect to order tracking
            // localStorage.removeItem('foodDeliveryCart'); // This would happen after successful order placement
            // alert('Proceeding to checkout! (Cart cleared for demo purposes)');
            // window.location.href = 'order-tracking.html';
        });
    }
});
