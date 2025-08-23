

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
}
async function syncCartWithServer(localCart) {
  const userId = localStorage.getItem("uid");  // later replace with real login
  
  try {
    const res = await fetch(`/api/cart/${userId}`);
    const data = await res.json();

    // If server has items, prefer server copy
    if (data.items && data.items.length > 0) {
      localStorage.setItem("cart", JSON.stringify(data.items));
    } else {
      // if server is empty but local has items, push local to server
      for (const item of localCart) {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            productId: item.name,
            quantity: item.quantity,
            img: item.image
          })
        });
      }
    }

    renderCartCount();

    // ✅ FIX: load cart if already on cart page
    if (document.querySelector('#cart.active')) localCart();

  } catch (err) {
    console.error("Cart sync failed", err);
  }
}


document.addEventListener("DOMContentLoaded", function () {
  const products = [
    { name: "Pink Festive Kurti", price: 599, img: "pic1.png", desc: "A blend of grace and comfort" },
    { name: "Elegant Floral Kurti", price: 799, img: "pic3.jpg", desc: "Bright and beautiful for every occasion" },
    { name: "Royal Blue Anarkali", price: 999, img: "pic4.jpg", desc: "Flowing elegance with rich colors" },
    { name: "Casual Day Kurti", price: 699, img: "pic4.png", desc: "Perfect for a casual outing" },
    { name: "Golden Festive Gown", price: 1499, img: "pic7.jpg", desc: "Shimmering gold for special days" },
    { name: "Classic Black Kurti", price: 899, img: "pic8.jpg", desc: "Simple, sleek, and stylish" }
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
      
            <button onclick="addToCart('${p.name}', ${p.price}, '${p.img}')">Add to Cart</button>
          </div>
        </a>
      </div>
    `;
    productSlider.innerHTML += productCard;
  });
});

async function addToCart(name, price, img) {
const userId = localStorage.getItem("uid");   // later replace with real user login
  const product = {
    name,
    price,
    image: img,
    quantity: 1
  };

  // Save to localStorage
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existing = cart.find(p => p.name === name);
  if (existing) existing.quantity++;
  else cart.push(product);
  localStorage.setItem("cart", JSON.stringify(cart));

  // Send to Firebase backend
await fetch("/api/cart", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId,
    name,         // ✅ add name
    price,        // ✅ add price
    image: img,   // ✅ consistent field name
    quantity: 1
  })
});

  alert(`${name} added to cart!`);
}

async function updateQuantity(userId, itemName, newQuantity) {
  try {
    const res = await fetch("/api/cart/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name: itemName, quantity: newQuantity }),
    });

    const data = await res.json();
    console.log("🔥 Cart updated:", data);
    loadCart(); // refresh UI from DB
  } catch (err) {
    console.error("Failed to update cart:", err);
  }
}


function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
  document.getElementById("mobileNav").classList.toggle("show");
}

const track = document.getElementById("carouselTrack");
const slides = track.children;
let index = 0;

function moveSlide(step) {
  index = (index + step + slides.length) % slides.length;
  const width = slides[0].clientWidth;
  track.style.transform = `translateX(-${index * width}px)`;
}

window.addEventListener('resize', () => moveSlide(0));

function scrollProducts(direction) {
  const slider = document.getElementById("productSlider");
  const scrollAmount = slider.querySelector(".product-card").offsetWidth + 20;
  slider.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}


(function () {
  console.log("Cart script loaded");

  const CART_KEY = "cart";

  function getCart() {
    const raw = localStorage.getItem(CART_KEY);
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  syncCartWithServer(getCart());
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCartCount();

  }

  function renderCartCount() {
    const cart = getCart();
    const count = cart.reduce((s, it) => s + (it.quantity || 0), 0);
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
    if (badge) badge.textContent = count;
  }


  window.loadCart = function () {
    const cart = getCart();
    const container = document.getElementById("cart-items");
    if (!container) return;
    container.innerHTML = "";
    if (cart.length === 0) {
      container.innerHTML = "<p>Your cart is empty.</p>";
      document.getElementById("cart-total").textContent = "Total: ₹0";
      return;
    }

    let total = 0;
    cart.forEach((item, idx) => {
      total += item.price * item.quantity;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
     <img src="${item.image}" width="50">
        <strong>${item.name}</strong>
        <span>₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}</span>
        <button class="remove-btn" data-idx="${idx}">Remove</button>
        <button class="inc-btn" data-idx="${idx}">+</button>
        <button class="dec-btn" data-idx="${idx}">−</button>
      `;
      container.appendChild(row);
    });

    document.getElementById("cart-total").textContent = `Total: ₹${total}`;

    container.querySelectorAll(".remove-btn").forEach(b => {
      b.addEventListener("click", () => {
        const c = getCart();
        c.splice(Number(b.dataset.idx), 1);
        saveCart(c);
        loadCart();
      });
    });

  container.querySelectorAll(".inc-btn").forEach(b => {
  b.addEventListener("click", async () => {
    const c = getCart();
    const idx = Number(b.dataset.idx);
    c[idx].quantity++;

    saveCart(c);
    loadCart();

    // 🔥 Update on server
    const userId = localStorage.getItem("uid");
    await updateQuantity(userId, c[idx].name, c[idx].quantity);
  });
});
    container.querySelectorAll(".dec-btn").forEach(b => {
      b.addEventListener("click", () => {
        const c = getCart();
        const idx = Number(b.dataset.idx);
        if (c[idx].quantity > 1) c[idx].quantity--;
        else c.splice(idx, 1);
      
        saveCart(c);
        loadCart();
      });
    });
  };

  window.showPage = function (id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'cart') loadCart();
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderCartCount();
    if (document.querySelector('#cart.active')) loadCart();
  });
})();
