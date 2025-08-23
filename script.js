const products = [
  {
    id: 1,
    name: "V-neck Short Kurti",
    price: 499,
    image: "images/pic1.png"
  },
  {
    id: 2,
    name: "Backless Top",
    price: 299,
    image: "images/pic1.jpg"
  },
  {
    id: 3,
    name: "Sleveless Kurti",
    price: 399,
    image: "images/pic2.png"
  },
  {
    id: 4,
    name: "Cute Long Kurti",
    price: 199,
    image: "images/pic3.png"
  }
];

const grid = document.getElementById("products-grid");

products.forEach(product => {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <img src="${product.image}" alt="${product.name}" />
    <div class="product-info">
      <h2>${product.name}</h2>
      <p>₹${product.price}</p>
      <button onclick="addToCart(${product.id})">Add to Cart</button>
    </div>
  `;
  grid.appendChild(card);
});

function addToCart(id) {
  const product = products.find(p => p.id === id);
  let cart = JSON.parse(localStorage.getItem("naariCart")) || [];

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem("naariCart", JSON.stringify(cart));
  alert(`${product.name} added to cart!`);
}