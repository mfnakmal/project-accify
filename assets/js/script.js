/* ---------- Utilities ---------- */
const toIDR = n => new Intl.NumberFormat('id-ID',{style:'currency', currency:'IDR', maximumFractionDigits:0}).format(n);
const el = sel => document.querySelector(sel);
const create = (tag, cls) => { const e=document.createElement(tag); if(cls) e.className=cls; return e; };
const randCode = () => {
  const s='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out='SBY-';
  for(let i=0;i<10;i++) out+=s[Math.floor(Math.random()*s.length)];
  return out;
};

const nowYear = new Date().getFullYear();
document.addEventListener('DOMContentLoaded',()=> el('#year').textContent = nowYear);

/* ===== Telegram Notify (Quick) =====
   WARNING: token terlihat di client. Untuk produksi, pakai proxy/serverless.
*/
const TELEGRAM = {
  enabled: true,                     // set false untuk mematikan
  botToken: "1056341684:AAGwa7VC-WfvHOh5EG8IYCSSLy5j7y5XWBE", // contoh: 123456789:ABCdefGhIj...
  chatId: "513402196"     // chat id pribadi (angka). Cek via @userinfobot
};
async function notifyTelegram(order){
  try {
    if (!TELEGRAM.enabled) return;
    const itemsText = (order.items||[]).map(i =>
      `• ${i.name} – ${i.variantName} (${i.type}) × ${i.qty} = ${toIDR(i.unitPrice*i.qty)}`
    ).join("\n") || "-";

    const text = [
      "<b>Accify – Konfirmasi Pembayaran</b>",
      `Order: <code>${order.orderId}</code>`,
      `Total: ${toIDR(order.amount)}`,
      `Metode: ${order.method}`,
      `Email: ${order.email}`,
      `WA: ${order.wa}`,
      "",
      "<b>Items</b>",
      itemsText,
      "",
      `Waktu: ${new Date().toLocaleString("id-ID")}`
    ].join("\n");

    const url = `https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: TELEGRAM.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });
    if (!res.ok) console.warn("Telegram gagal:", await res.text());
  } catch (err) {
    console.error("Telegram error:", err);
  }
}

/* ---------- Mock Catalog Data ---------- */
const CATALOG = [
  {
    id:'yt',
    name:'YouTube Premium',
    brand:'Google',
    emoji:'▶️',
    types:['Voucher','Family Slot','Top-Up'],
    variants:[
      {id:'yt-1', name:'1 Bulan', months:1, price:69000},
      {id:'yt-3', name:'3 Bulan', months:3, price:189000},
      {id:'yt-12', name:'12 Bulan', months:12, price:699000}
    ]
  },
  {
    id:'sp',
    name:'Spotify Premium',
    brand:'Spotify',
    emoji:'🎵',
    types:['Voucher','Family Slot'],
    variants:[
      {id:'sp-1', name:'1 Bulan', months:1, price:55000},
      {id:'sp-3', name:'3 Bulan', months:3, price:149000}
    ]
  },
  {
    id:'nf',
    name:'Netflix',
    brand:'Netflix',
    emoji:'🎬',
    types:['Voucher'],
    variants:[
      {id:'nf-1', name:'1 Bulan', months:1, price:120000},
      {id:'nf-3', name:'3 Bulan', months:3, price:335000}
    ]
  },
  {
    id:'cc',
    name:'CapCut Premium',
    brand:'Bytedance',
    emoji:'✂️',
    types:['Voucher'],
    variants:[
      {id:'cc-1', name:'1 Bulan', months:1, price:45000},
      {id:'cc-12', name:'12 Bulan', months:12, price:399000}
    ]
  },
  {
    id:'cg',
    name:'ChatGPT Plus',
    brand:'OpenAI',
    emoji:'🤖',
    types:['Top-Up'],
    variants:[
      {id:'cg-1', name:'1 Bulan', months:1, price:350000}
    ]
  },
  {
    id:'dc',
    name:'Discord Nitro',
    brand:'Discord',
    emoji:'💎',
    types:['Voucher'],
    variants:[
      {id:'dc-1', name:'1 Bulan + 2 Boost', months:1, price:99000},
      {id:'dc-12', name:'12 Bulan + 2 Boost', months:12, price:899000}
    ]
  }
];

/* ---------- State ---------- */
const state = {
  cart: JSON.parse(localStorage.getItem('subify_cart')||'[]'), // items: {pid, vid, type, qty, unitPrice, name, variantName}
  filter: '',
  pendingOrder: null          // diset saat masuk modal pembayaran
};
const saveCart = () => localStorage.setItem('subify_cart', JSON.stringify(state.cart));
const cartTotal = () => state.cart.reduce((s,i)=>s + i.unitPrice*i.qty, 0);

/* ---------- Render Catalog ---------- */
const catalogEl = el('#catalog');
function renderCatalog() {
  catalogEl.innerHTML = '';
  const q = state.filter.trim().toLowerCase();
  const list = CATALOG.filter(p =>
    !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.id.includes(q)
  );
  list.forEach(p => {
    const card = create('div','card product');
    card.innerHTML = `
      <div class="p-thumb">${p.emoji}</div>
      <div class="p-brand">${p.brand}</div>
      <div class="p-name">${p.name}</div>
      <div class="p-tags">
        ${p.variants.slice(0,2).map(v=>`<span class="tag">${v.name}</span>`).join('')}
      </div>
      <button class="btn buy">Lihat & Pilih</button>
    `;
    card.querySelector('.buy').addEventListener('click',()=> openProductModal(p.id));
    catalogEl.appendChild(card);
  });
}
renderCatalog();

/* ---------- Search ---------- */
el('#searchInput').addEventListener('input', e => {
  state.filter = e.target.value;
  renderCatalog();
});

/* ---------- Product Modal ---------- */
const productModal = el('#productModal');
el('#closeProductModal').onclick = () => closeModal(productModal);

function openProductModal(pid){
  const p = CATALOG.find(x=>x.id===pid);
  if(!p) return;
  const content = `
    <div class="detail">
      <div>
        <div class="d-thumb">${p.emoji}</div>
        <p class="small">Brand: ${p.brand}</p>
      </div>
      <div>
        <h3>${p.name}</h3>
        <div class="opt">
          <h4>Durasi</h4>
          <div class="row" id="optVariants">
            ${p.variants.map((v,i)=>`
              <label class="radio-tile">
                <input type="radio" name="variant" value="${v.id}" ${i===0?'checked':''}>
                <span>${v.name} • ${toIDR(v.price)}</span>
              </label>`).join('')}
          </div>
        </div>
        <div class="opt">
          <h4>Tipe Produk</h4>
          <div class="row">
            ${p.types.map((t,i)=>`
              <label class="radio-tile">
                <input type="radio" name="ptype" value="${t}" ${i===0?'checked':''}>
                <span>${t}</span>
              </label>`).join('')}
          </div>
        </div>
        <div class="opt qty">
          <h4>Jumlah</h4>
          <input id="qty" type="number" min="1" max="20" value="1"/>
        </div>
        <div class="price">
          <div>
            <div class="small">Subtotal</div>
            <div id="subtotal" style="font-weight:700">${toIDR(p.variants[0].price)}</div>
          </div>
          <button id="addToCart" class="btn primary">Tambah ke Keranjang</button>
        </div>
      </div>
    </div>
  `;
  el('#modalContent').innerHTML = content;

  // dynamic subtotal
  const variantInputs = [...productModal.querySelectorAll('input[name="variant"]')];
  const qtyEl = productModal.querySelector('#qty');
  const updateSubtotal = () => {
    const vid = productModal.querySelector('input[name="variant"]:checked').value;
    const v = p.variants.find(x=>x.id===vid);
    const qty = Math.max(1, Math.min(20, parseInt(qtyEl.value||'1',10)));
    qtyEl.value = qty;
    el('#subtotal').textContent = toIDR(v.price * qty);
  };
  variantInputs.forEach(i=>i.addEventListener('change', updateSubtotal));
  qtyEl.addEventListener('input', updateSubtotal);
  updateSubtotal();

  // add to cart
  productModal.querySelector('#addToCart').onclick = () => {
    const vid = productModal.querySelector('input[name="variant"]:checked').value;
    const type = productModal.querySelector('input[name="ptype"]:checked').value;
    const v = p.variants.find(x=>x.id===vid);
    const qty = parseInt(qtyEl.value,10) || 1;

    // merge if same line
    const existing = state.cart.find(i=>i.pid===p.id && i.vid===vid && i.type===type);
    if(existing) existing.qty += qty;
    else state.cart.push({
      pid:p.id, vid:vid, type, qty,
      unitPrice:v.price, name:p.name, variantName:v.name
    });
    saveCart();
    refreshCartUI();
    closeModal(productModal);
    openCart();
  };

  openModal(productModal);
}

function openModal(m){ m.classList.remove('hidden'); m.setAttribute('aria-hidden','false'); }
function closeModal(m){ m.classList.add('hidden'); m.setAttribute('aria-hidden','true'); }

/* ---------- Cart Drawer ---------- */
const drawer = el('#cartDrawer');
const mask = el('#drawerMask');
const cartBtn = el('#cartBtn');
const closeCart = el('#closeCart');
const toCheckoutFromDrawer = el('#toCheckoutFromDrawer');

function openCart(){ drawer.classList.add('open'); mask.classList.add('show'); }
function closeCartDrawer(){ drawer.classList.remove('open'); mask.classList.remove('show'); }
cartBtn.onclick = openCart;
closeCart.onclick = closeCartDrawer;
mask.onclick = closeCartDrawer;

function refreshCartUI(){
  const list = el('#cartItems');
  list.innerHTML = '';
  if(state.cart.length===0){
    list.innerHTML = `<p class="small">Keranjang kosong.</p>`;
  } else {
    state.cart.forEach((i,idx)=>{
      const row = create('div','cart-item');
      row.innerHTML = `
        <div>
          <div><strong>${i.name}</strong> • ${i.variantName}</div>
          <div class="item-meta">${i.type} • Qty ${i.qty}</div>
        </div>
        <div style="text-align:right">
          <div><strong>${toIDR(i.unitPrice*i.qty)}</strong></div>
          <button class="icon-btn" data-rm="${idx}" title="Hapus">Hapus</button>
        </div>
      `;
      row.querySelector('[data-rm]').onclick = (e)=>{
        const idx = +e.currentTarget.dataset.rm;
        state.cart.splice(idx,1);
        saveCart(); refreshCartUI();
      };
      list.appendChild(row);
    });
  }
  const total = cartTotal();
  el('#cartTotal').textContent = toIDR(total);
  el('#cartCount').textContent = state.cart.reduce((s,i)=>s+i.qty,0);
  el('#checkoutBtn').disabled = state.cart.length===0;
  toCheckoutFromDrawer.disabled = state.cart.length===0;
}
refreshCartUI();

/* ---------- Checkout ---------- */
const checkoutModal = el('#checkoutModal');
const summaryEl = el('#summary');
const summaryTotal = el('#summaryTotal');

function openCheckout(){
  // fill summary
  summaryEl.innerHTML = state.cart.map(i=>`
    <div class="summary-item">
      <span>${i.name} – ${i.variantName} (${i.type}) × ${i.qty}</span>
      <span>${toIDR(i.unitPrice*i.qty)}</span>
    </div>
  `).join('');
  summaryTotal.textContent = toIDR(cartTotal());
  openModal(checkoutModal);
}
el('#checkoutBtn').onclick = openCheckout;
toCheckoutFromDrawer.onclick = ()=>{ closeCartDrawer(); openCheckout(); };
el('#closeCheckout').onclick = ()=>closeModal(checkoutModal);

el('#buyerForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  if(state.cart.length===0) return;

  const orderId = randCode();
  el('#orderCode').textContent = orderId; // utk nanti di success

  // ambil metode
  const payMethod = document.querySelector('input[name="pay"]:checked')?.value || 'QRIS';

  // open payment modal
  closeModal(checkoutModal);
  openPaymentView({
    orderId,
    method: payMethod,
    amount: cartTotal(),
    email: el('#buyerEmail').value.trim(),
    wa: el('#buyerWa').value.trim()
  });
});

el('#closeSuccess').onclick = ()=>closeModal(el('#successModal'));
el('#doneSuccess').onclick = ()=>closeModal(el('#successModal'));

/* ---------- Header Checkout Btn when no drawer ---------- */
el('#checkoutBtn').addEventListener('click', ()=> {
  if(state.cart.length>0) openCheckout();
});

/* ---------- Payment Modal (Dummy) ---------- */
const payModal = el('#payModal');
const payView = el('#payView');
el('#closePay').onclick = ()=> closeModal(payModal);

let countdownTimer = null;
function startCountdown(minutes=15){
  const node = payView.querySelector('.countdown');
  let secs = minutes*60;
  clearInterval(countdownTimer);
  const tick = ()=>{
    const m = Math.floor(secs/60).toString().padStart(2,'0');
    const s = (secs%60).toString().padStart(2,'0');
    node.textContent = `${m}:${s}`;
    if(secs<=0){ clearInterval(countdownTimer); node.textContent = '00:00'; }
    secs--;
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function copy(text){
  navigator.clipboard?.writeText(text);
}

function openPaymentView({orderId, method, amount, email, wa}){
  const commonRight = `
    <div class="pay-card">
      <div class="pay-head">
        <div>
          <div class="small">Kode Transaksi</div>
          <div class="copy"><span class="code">${orderId}</span>
            <button class="btn ghost" id="copyOrder">Salin</button></div>
        </div>
        <span class="badge-soft countdown">15:00</span>
      </div>
      <div class="meta">
        <div class="row"><span>Total</span><span class="pay-amount">${toIDR(amount)}</span></div>
        <div class="row"><span>Email</span><span class="small">${email}</span></div>
        <div class="row"><span>WhatsApp</span><span class="small">${wa}</span></div>
        <div class="row"><span>Metode</span><span class="small">${method}</span></div>
      </div>
      <div class="actions-row">
        <button class="btn" id="cancelPay">Batal</button>
        <button class="btn primary" id="markPaid">Saya sudah bayar</button>
      </div>
    </div>
  `;

  let left = '';
  if(method === 'QRIS'){
    left = `
      <div class="pay-card">
        <div class="pay-head">
          <div class="small">Bayar dengan</div>
          <div class="badge-soft">QRIS (Dummy)</div>
        </div>
        <div class="qr-box"><div class="qr"></div></div>
        <ul class="pay-steps">
          <li>Buka aplikasi pembayaran (Gopay/OVO/Dana/Bank).</li>
          <li>Pilih scan QR, arahkan ke kode QR di atas.</li>
          <li>Pastikan nominal: <strong>${toIDR(amount)}</strong>.</li>
          <li>Konfirmasi & selesaikan pembayaran.</li>
        </ul>
      </div>
    `;
  } else if (method === 'VA BCA' || method === 'VA BNI'){
    const va = (method==='VA BCA'?'0208':'0098') + Math.floor(1000000000 + Math.random()*8999999999);
    left = `
      <div class="pay-card">
        <div class="pay-head">
          <div class="bank-logo">${method.includes('BCA')?'BCA':'BNI'}</div>
          <span class="badge-soft">Virtual Account (Dummy)</span>
        </div>
        <div class="copy" style="margin:6px 0 12px">
          <span class="code" id="vaCode">${va}</span>
          <button class="btn ghost" id="copyVA">Salin VA</button>
        </div>
        <div class="meta">
          <div class="row"><span>Nominal</span><strong>${toIDR(amount)}</strong></div>
          <div class="row"><span>Batas Bayar</span><span class="small">15 menit</span></div>
        </div>
        <ul class="pay-steps" style="margin-top:10px">
          <li>Masukkan nomor VA di aplikasi/ATM ${method.includes('BCA')?'BCA':'BNI'}.</li>
          <li>Pastikan nama tujuan “SUBIFY TEST”.</li>
          <li>Bayar sesuai nominal.</li>
        </ul>
      </div>
    `;
  } else if (method === 'E-Wallet'){
    const code = 'EW' + Math.floor(10000000 + Math.random()*89999999);
    left = `
      <div class="pay-card">
        <div class="pay-head">
          <div class="small">Bayar dengan</div>
          <div class="badge-soft">E-Wallet (Dummy)</div>
        </div>
        <div class="copy" style="margin:6px 0 12px">
          <span class="code" id="ewCode">${code}</span>
          <button class="btn ghost" id="copyEW">Salin Kode</button>
        </div>
        <div class="actions-row">
          <button class="btn">Buka OVO (dummy)</button>
          <button class="btn">Buka DANA (dummy)</button>
          <button class="btn">Buka GoPay (dummy)</button>
        </div>
        <ul class="pay-steps" style="margin-top:12px">
          <li>Masukkan kode pembayaran di aplikasi e-wallet.</li>
          <li>Bayar sesuai nominal: <strong>${toIDR(amount)}</strong>.</li>
          <li>Kembali ke halaman ini dan klik “Saya sudah bayar”.</li>
        </ul>
      </div>
    `;
  } else { // Transfer Bank
    left = `
      <div class="pay-card">
        <div class="pay-head">
          <div class="small">Transfer Manual</div>
          <div class="badge-soft">Rekening (Dummy)</div>
        </div>
        <div class="meta">
          <div class="row"><span>Bank</span><span>Bank BCA</span></div>
          <div class="row"><span>No. Rekening</span>
            <span class="copy"><span class="code" id="rek">1234567890</span>
            <button class="btn ghost" id="copyRek">Salin</button></span></div>
          <div class="row"><span>Atas Nama</span><span>PT Subify Test</span></div>
          <div class="row"><span>Nominal</span><strong>${toIDR(amount)}</strong></div>
        </div>
        <ul class="pay-steps" style="margin-top:12px">
          <li>Lakukan transfer sesuai nominal.</li>
          <li>Tambahkan berita: <strong>${orderId}</strong>.</li>
          <li>Setelah transfer, klik “Saya sudah bayar”.</li>
        </ul>
      </div>
    `;
  }

  payView.innerHTML = left + commonRight;
  openModal(payModal);
  startCountdown(15);

  // simpan order untuk notifikasi
  state.pendingOrder = {
    orderId, method, amount, email, wa,
    items: state.cart.slice()
  };

  // bind copy buttons
  const co = el('#copyOrder'); if(co) co.onclick = ()=>copy(orderId);
  const vaBtn = el('#copyVA'); if(vaBtn) vaBtn.onclick = ()=>copy(el('#vaCode').textContent);
  const ewBtn = el('#copyEW'); if(ewBtn) ewBtn.onclick = ()=>copy(el('#ewCode').textContent);
  const rkBtn = el('#copyRek'); if(rkBtn) rkBtn.onclick = ()=>copy(el('#rek').textContent);

  // cancel / mark paid
  el('#cancelPay').onclick = ()=> { closeModal(payModal); };
  el('#markPaid').onclick = async ()=> {
    // kirim ke Telegram
    if (state.pendingOrder) {
      await notifyTelegram(state.pendingOrder);
    }
    // show success modal
    closeModal(payModal);
    openModal(el('#successModal'));
    // kosongkan cart
    state.cart = [];
    state.pendingOrder = null;
    saveCart();
    refreshCartUI();
  };
}
