function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
}

// Global variables for authentication
window.currentUser = null;
window.currentUserId = null;

// Initialize Firebase Auth listener (this will be called from index.html)
window.initAuthListener = function(auth) {
  auth.onAuthStateChanged((user) => {
    window.currentUser = user;
    window.currentUserId = user ? user.uid : null;
    
    // Update cart count when auth state changes
    if (user) {
      renderCartCount();
      // If user just logged in and is viewing cart, reload it
      if (document.querySelector('#cart.active')) {
        loadCart();
      }
    } else {
      // Clear cart count when logged out
      const badge = document.getElementById("cart-count");
      if (badge) {
        badge.style.display = "none";
      }
    }
  });
};

document.addEventListener("DOMContentLoaded", function () {
  const products = [
    { name: "Pink Festive Kurti", price: 50, img: "realpic.jpg", desc: "A blend of grace and comfort" },
    { name: "Elegant Floral Kurti", price: 100, img: "realpic1.jpg", desc: "Bright and beautiful for every occasion" },
    { name: "Royal Blue Anarkali", price: 100, img: "realpic2.jpg", desc: "Flowing elegance with rich colors" },
    { name: "Casual Day Kurti", price: 100, img: "realpic3.jpg", desc: "Perfect for a casual outing" },
    { name: "Golden Festive Gown", price: 100, img: "pic7.jpg", desc: "Shimmering gold for special days" },
    { name: "Classic Black Kurti", price: 50, img: "pic8.jpg", desc: "Simple, sleek, and stylish" }
  ];

  const productSlider = document.getElementById("productSlider");

  products.forEach(p => {
    const productCard = `
      <div class="product-card">
        <a href="product-details.html?name=${encodeURIComponent(p.name)}&price=${p.price}&img=${p.img}&desc=${encodeURIComponent(p.desc)}" class="product-card">
          <img src="${p.img}" alt="${p.name}">
          <div class="info">
            <h3>${p.name}</h3>
            <p>₹${p.price}</p>
            <button onclick="addToCart('${p.name}', ${p.price}, '${p.img}')" class="add-to-cart-btn">Add to Cart</button>
          </div>
        </a>
      </div>
    `;
    productSlider.innerHTML += productCard;
  });

  // Initialize cart count on page load
  renderCartCount();
});

// ✅ NEW: Check if user is logged in before adding to cart
async function addToCart(name, price, img) {
  // Check if user is logged in
  if (!window.currentUser || !window.currentUserId) {
    // Show login prompt with modern styling
    showLoginPrompt(name);
    return;
  }

  const userId = window.currentUserId;
  
  try {
    // Check if item already exists in cart
    const cartResponse = await fetch(`/api/cart/${userId}`);
    const cartData = await cartResponse.json();
    const existingItems = cartData.items || [];
    
    const existingItem = existingItems.find(item => item.name === name);
    
    if (existingItem) {
      // Update quantity if item exists
      await updateQuantity(userId, name, existingItem.quantity + 1);
    } else {
      // Add new item to cart
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name,
          price,
          image: img,
          quantity: 1
        })
      });
    }

    showSuccessMessage(`${name} added to cart! 🛒`);
    renderCartCount();
    
    // Refresh cart if currently viewing cart page
    if (document.querySelector('#cart.active')) {
      loadCart();
    }
    
  } catch (err) {
    console.error("Failed to add item to cart:", err);
    showErrorMessage("Failed to add item to cart. Please try again.");
  }
}

// ✅ NEW: Show modern login prompt
function showLoginPrompt(productName) {
  // Remove existing prompt if any
  const existingPrompt = document.getElementById('login-prompt-overlay');
  if (existingPrompt) {
    existingPrompt.remove();
  }

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'login-prompt-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;

  // Create prompt box
  const promptBox = document.createElement('div');
  promptBox.style.cssText = `
    background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 1px solid #e9ecef;
    animation: slideIn 0.3s ease-out;
  `;

  promptBox.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 20px;">🔐</div>
    <h3 style="color: #b3005e; margin-bottom: 15px; font-size: 1.5rem;">Login Required</h3>
    <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">
      Please log in to add <strong>"${productName}"</strong> to your cart and enjoy a personalized shopping experience.
    </p>
    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
      <button id="login-prompt-btn" style="
        background: linear-gradient(135deg, #b3005e 0%, #d1477a 100%);
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(179, 0, 94, 0.3);
      ">Go to Login</button>
      <button id="cancel-prompt-btn" style="
        background: #fff;
        color: #666;
        border: 2px solid #ddd;
        padding: 12px 30px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1rem;
        transition: all 0.3s ease;
      ">Maybe Later</button>
    </div>
  `;

  // Add animation keyframes
  if (!document.getElementById('login-prompt-styles')) {
    const style = document.createElement('style');
    style.id = 'login-prompt-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateY(-50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  overlay.appendChild(promptBox);
  document.body.appendChild(overlay);

  // Add event listeners
  document.getElementById('login-prompt-btn').onclick = () => {
    overlay.remove();
    showPage('login');
  };

  document.getElementById('cancel-prompt-btn').onclick = () => {
    overlay.remove();
  };

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };
}

// ✅ NEW: Show success message
function showSuccessMessage(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    z-index: 10000;
    font-weight: bold;
    box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
    animation: slideInRight 0.3s ease-out;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ✅ NEW: Show error message
function showErrorMessage(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    z-index: 10000;
    font-weight: bold;
    box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
    animation: slideInRight 0.3s ease-out;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add toast animations
if (!document.getElementById('toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

async function updateQuantity(userId, itemName, newQuantity) {
  if (!userId) {
    showErrorMessage("Please log in to update cart items.");
    return;
  }

  try {
    const res = await fetch("/api/cart/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name: itemName, quantity: newQuantity }),
    });

    const data = await res.json();
    console.log("Cart updated:", data);
    renderCartCount();
    
    // Refresh cart if currently viewing cart page
    if (document.querySelector('#cart.active')) {
      loadCart();
    }
  } catch (err) {
    console.error("Failed to update cart:", err);
    showErrorMessage("Failed to update cart.");
  }
}

async function removeFromCart(userId, itemName) {
  if (!userId) {
    showErrorMessage("Please log in to remove cart items.");
    return;
  }

  try {
    await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name: itemName })
    });
    
    console.log("Item removed from cart:", itemName);
    renderCartCount();
    loadCart(); // Refresh cart display
  } catch (err) {
    console.error("Failed to remove from cart:", err);
    showErrorMessage("Failed to remove item from cart.");
  }
}

async function renderCartCount() {
  const userId = window.currentUserId;
  
  if (!userId) {
    // Hide cart count if not logged in
    const badge = document.getElementById("cart-count");
    if (badge) {
      badge.style.display = "none";
    }
    return;
  }
  
  try {
    const res = await fetch(`/api/cart/${userId}`);
    const data = await res.json();
    const items = data.items || [];
    
    const count = items.reduce((total, item) => total + (item.quantity || 0), 0);
    
    let badge = document.getElementById("cart-count");
    if (!badge) {
      const cartLink = Array.from(document.querySelectorAll("nav a"))
        .find(a => (a.getAttribute("onclick") || "").includes("showPage('cart')"));
      if (cartLink) {
        badge = document.createElement("span");
        badge.id = "cart-count";
        badge.style.marginLeft = "6px";
        badge.style.background = "#b3005e";
        badge.style.color = "#fff";
        badge.style.padding = "2px 6px";
        badge.style.borderRadius = "999px";
        badge.style.fontSize = "0.8rem";
        cartLink.appendChild(badge);
      }
    }
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline" : "none";
    }
  } catch (err) {
    console.error("Failed to render cart count:", err);
  }
}

async function loadCart() {
  const userId = window.currentUserId;
  const container = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  
  if (!container) return;
  
  // Check if user is logged in
  if (!userId) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 4rem; margin-bottom: 20px;">🛒</div>
        <h3 style="color: #b3005e; margin-bottom: 15px;">Please Log In</h3>
        <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">
          Log in to view your cart items and continue shopping.
        </p>
        <button onclick="showPage('login')" style="
          background: linear-gradient(135deg, #b3005e 0%, #d1477a 100%);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(179, 0, 94, 0.3);
        ">Go to Login</button>
      </div>
    `;
    if (totalElement) totalElement.textContent = "Total: ₹0";
    return;
  }
  
  try {
    const res = await fetch(`/api/cart/${userId}`);
    const data = await res.json();
    const items = data.items || [];
    
    container.innerHTML = "";
    
    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 4rem; margin-bottom: 20px;">🛍️</div>
          <h3 style="color: #666; margin-bottom: 15px;">Your cart is empty</h3>
          <p style="color: #888; margin-bottom: 30px;">
            Discover our beautiful collection and add some items to your cart.
          </p>
          <button onclick="showPage('products')" style="
            background: linear-gradient(135deg, #b3005e 0%, #d1477a 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(179, 0, 94, 0.3);
          ">Browse Products</button>
        </div>
      `;
      if (totalElement) totalElement.textContent = "Total: ₹0";
      return;
    }

    let total = 0;
    items.forEach((item, idx) => {
      total += item.price * item.quantity;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${item.image}" width="50" alt="${item.name}">
        <div class="item-details">
          <strong>${item.name}</strong>
          <span>₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}</span>
        </div>
        <div class="item-controls">
          <button class="dec-btn" onclick="decreaseQuantity('${item.name}', ${item.quantity})">−</button>
          <span class="quantity">${item.quantity}</span>
          <button class="inc-btn" onclick="increaseQuantity('${item.name}', ${item.quantity})">+</button>
          <button class="remove-btn" onclick="removeItem('${item.name}')">Remove</button>
        </div>
      `;
      container.appendChild(row);
    });

    if (totalElement) {
      totalElement.textContent = `Total: ₹${total}`;
    }
    
    // Add checkout button if items exist
    if (items.length > 0) {
      const checkoutBtn = document.createElement("button");
      checkoutBtn.textContent = "Proceed to Checkout";
      checkoutBtn.className = "checkout-btn";
      checkoutBtn.onclick = () => checkout(total);
      container.appendChild(checkoutBtn);
    }

  } catch (err) {
    console.error("Failed to load cart:", err);
    container.innerHTML = "<p>Failed to load cart. Please try again.</p>";
  }
}

async function increaseQuantity(itemName, currentQuantity) {
  const userId = window.currentUserId;
  await updateQuantity(userId, itemName, currentQuantity + 1);
}

async function decreaseQuantity(itemName, currentQuantity) {
  const userId = window.currentUserId;
  if (currentQuantity > 1) {
    await updateQuantity(userId, itemName, currentQuantity - 1);
  } else {
    await removeItem(itemName);
  }
}

async function removeItem(itemName) {
  const userId = window.currentUserId;
  await removeFromCart(userId, itemName);
}

async function checkout(total) {
  const userId = window.currentUserId;
  
  if (!userId) {
    showErrorMessage("Please log in to checkout.");
    return;
  }

  try {
    // Create Razorpay order
    const orderResponse = await fetch('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total })
    });
    
    const order = await orderResponse.json();
    
    // Initialize Razorpay checkout
    const options = {
      key: 'rzp_live_RFw0G7jDnWOVWV',
      amount: order.amount,
      currency: 'INR',
      order_id: order.id,
      name: 'Naari Fashion',
      description: 'Purchase from Naari',
      handler: async function(response) {
        try {
          // Payment successful - clear cart
          showSuccessMessage('Payment successful! Order ID: ' + response.razorpay_order_id);
          
          // Clear cart after successful payment
          await fetch(`/api/delete-user/${userId}`, { method: 'DELETE' });
          
          renderCartCount();
          loadCart();
          
        } catch (err) {
          console.error("Error processing successful payment:", err);
        }
      },
      prefill: {
        name: window.currentUser?.displayName || '',
        email: window.currentUser?.email || '',
        contact: ''
      },
      theme: {
        color: '#b3005e'
      }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
    
  } catch (err) {
    console.error("Checkout failed:", err);
    showErrorMessage("Checkout failed. Please try again.");
  }
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'cart') loadCart();
}

function toggleMobileMenu() {
  document.getElementById("mobileNav").classList.toggle("show");
}

const track = document.getElementById("carouselTrack");
if (track) {
  const slides = track.children;
  let index = 0;

  window.moveSlide = function(step) {
    index = (index + step + slides.length) % slides.length;
    const width = slides[0].clientWidth;
    track.style.transform = `translateX(-${index * width}px)`;
  }

  window.addEventListener('resize', () => moveSlide(0));
}

function scrollProducts(direction) {
  const slider = document.getElementById("productSlider");
  if (slider) {
    const scrollAmount = slider.querySelector(".product-card").offsetWidth + 20;
    slider.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  }
}



