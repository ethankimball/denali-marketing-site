const products = [
  {id:'fudge',name:'Homemade Fudge',category:'Fudge',image:'assets/fudge-box-logo-v12.png',heroScale:.88,description:'A tidy presentation of rich homemade fudge pieces, ready for the Christmas candy counter.',style:'Cut pieces with seasonal finishes',presentation:'Navy gift tray with Mount Moosilauke label'},
  {id:'lollipops',name:'Christmas Lollipops',category:'Old-fashioned candy',image:'assets/lollipops-v9.png',heroScale:.72,description:'Cheerful red, cream, and winter-blue swirls inspired by the lollipop in the Mount Moosilauke moose logo.',style:'Wrapped spiral lollipops',presentation:'Individual clear wraps with navy ties'},
  {id:'moose-pops',name:'Chocolate Moose Pops',category:'Woodsville favorites',image:'assets/moose-pops-v2.png',heroScale:.78,description:'Playful moose-shaped chocolate pops that bring the shop’s New Hampshire identity right to the candy counter.',style:'Molded chocolate pops',presentation:'Clear wraps in a navy presentation sleeve'},
  {id:'cookies',name:'Cranberry Snow Cookies',category:'Special cookies',image:'assets/cranberry-cookies-v9.png',heroScale:.77,description:'A seasonal cookie concept with cranberry, chocolate-dipped edges, and an old-fashioned bakery finish.',style:'Shortbread-style seasonal cookies',presentation:'Parchment band with navy baker’s twine'},
  {id:'wreath',name:'Holiday Chocolate Wreath',category:'Seasonal chocolate',image:'assets/wreath-v2.png',heroScale:.75,description:'A homemade chocolate wreath finished with a cranberry ribbon for the Christmas table.',style:'Decorative molded chocolate',presentation:'Gift-ready holiday wreath'},
  {id:'clusters',name:'Milk Chocolate Peanut Clusters',category:'Chocolates',image:'assets/peanut-clusters-v9.png',heroScale:.7,description:'A specific chocolate-counter favorite: irregular milk-chocolate clusters with visible roasted-peanut texture.',style:'Small-batch chocolate clusters',presentation:'Cream candy cups in a navy tray'},
  {id:'cross',name:'Chocolate Cross',category:'Specialty chocolate',image:'assets/chocolate-cross-v9.png',heroScale:.62,description:'A polished remake of the shop’s distinctive molded chocolate cross, finished with its small pale-blue sugar flower.',style:'Molded dark chocolate',presentation:'Individual specialty confection'}
];
const state = {active:0,cart:JSON.parse(localStorage.getItem('mmc-cart-v3')||'[]'),boxSize:6,box:[],selected:null,qty:1,filter:'All'};
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const heroProducts=[products[0],products[1],products[2],products[3],products[4],products[6]];
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const HERO_ROTATION_MS=4000;
const HERO_FADE_MS=300;
let heroTimer=0,heroFadeToken=0,heroProductHovered=false;

heroProducts.forEach(product=>{const preload=new Image();preload.src=product.image;});

const snowfield=$('#snowfall');
for(let i=0;i<112;i+=1){
  const flake=document.createElement('i');
  const x=(i*37+11)%100,size=2+(i*7)%11,duration=8+(i*5)%10,drift=-34+(i*13)%69;
  flake.style.cssText=`--x:${x}%;--size:${size}px;--duration:${duration}s;--delay:${-(i*1.37)%duration}s;--drift:${drift}px`;
  snowfield.append(flake);
}

function renderSelectors(){
  const offsets=[-2,-1,1,2];
  $$('.selector').forEach((button,slot)=>{
    const index=(state.active+offsets[slot]+heroProducts.length)%heroProducts.length;
    const product=heroProducts[index];
    button.dataset.slide=index;
    button.setAttribute('aria-label',`Show ${product.name}`);
    const image=$('img',button);
    image.src=product.image;
    image.alt='';
  });
}

function setHero(index,announce=true,fade=true){
  const target=(index+heroProducts.length)%heroProducts.length;
  state.active=target;
  const product=heroProducts[target],stage=$('#featuredProduct'),image=$('#heroProductImage'),hero=$('.stage');
  const apply=()=>{
    image.src=product.image; image.alt=product.name;
    stage.style.setProperty('--hero-scale',product.heroScale||.72);
    stage.dataset.activeProduct=product.id;
    stage.classList.remove('is-tag-visible');
    stage.setAttribute('aria-expanded','false');
    stage.setAttribute('aria-label',`Show ${product.name} name`);
    $('#heroProductName').textContent=product.name;
    $('#heroViewProduct').dataset.product=product.id;
    $('#heroViewProduct').setAttribute('aria-label',`View ${product.name}`);
    renderSelectors();
    if(announce)$('#slideStatus').textContent=`Showing ${product.name}, item ${state.active+1} of 6`;
  };
  const token=++heroFadeToken;
  if(!fade||reducedMotion.matches){hero.classList.remove('is-fading');apply();return;}
  hero.classList.add('is-fading');
  window.setTimeout(()=>{
    if(token!==heroFadeToken)return;
    apply();
    requestAnimationFrame(()=>requestAnimationFrame(()=>hero.classList.remove('is-fading')));
  },HERO_FADE_MS);
}
function pauseHero(){window.clearTimeout(heroTimer);heroTimer=0;}
function scheduleHero(){
  pauseHero();
  if(document.hidden||heroProductHovered)return;
  heroTimer=window.setTimeout(()=>{setHero(state.active+1,false);scheduleHero();},HERO_ROTATION_MS);
}
function chooseHero(index){setHero(index);scheduleHero();}
$('#prevSlide').onclick=()=>chooseHero(state.active-1); $('#nextSlide').onclick=()=>chooseHero(state.active+1);
$$('.selector').forEach(button=>button.onclick=()=>chooseHero(Number(button.dataset.slide)));
document.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')chooseHero(state.active-1);if(event.key==='ArrowRight')chooseHero(state.active+1);});
let touchStartX=0,lastHeroSwipe=0;
const heroStage=$('.stage');
heroStage.addEventListener('touchstart',event=>{touchStartX=event.changedTouches[0].clientX;},{passive:true});
heroStage.addEventListener('touchend',event=>{const distance=event.changedTouches[0].clientX-touchStartX;if(Math.abs(distance)>45){lastHeroSwipe=Date.now();chooseHero(state.active+(distance<0?1:-1));}},{passive:true});
document.addEventListener('visibilitychange',()=>document.hidden?pauseHero():scheduleHero());
const featuredProduct=$('#featuredProduct');
const touchPointer=window.matchMedia('(hover: none), (pointer: coarse)');
featuredProduct.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){heroProductHovered=true;pauseHero();}});
featuredProduct.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){heroProductHovered=false;scheduleHero();}});
function setHeroTagVisible(visible){featuredProduct.classList.toggle('is-tag-visible',visible);featuredProduct.setAttribute('aria-expanded',String(visible));}
featuredProduct.addEventListener('click',event=>{if(!touchPointer.matches||Date.now()-lastHeroSwipe<400)return;event.stopPropagation();setHeroTagVisible(!featuredProduct.classList.contains('is-tag-visible'));});
featuredProduct.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setHeroTagVisible(!featuredProduct.classList.contains('is-tag-visible'));}});
document.addEventListener('click',event=>{if(!event.target.closest('#featuredProduct,#heroViewProduct'))setHeroTagVisible(false);});

$$('.dock a[href^="#"],.pin[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  const target=$(link.getAttribute('href')); if(!target)return;
  event.preventDefault();
  target.scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth',block:'start'});
  history.replaceState(null,'',link.getAttribute('href'));
  link.classList.remove('is-activated'); void link.offsetWidth; link.classList.add('is-activated');
  window.setTimeout(()=>link.classList.remove('is-activated'),520);
}));

function productCard(product){return `<article class="product-card"><div class="product-card-image"><img src="${product.image}" alt="${product.name}" loading="lazy"></div><button data-product="${product.id}"><span><small>${product.category}</small><h3>${product.name}</h3></span><svg class="direction-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></button></article>`;}
$('#productGrid').innerHTML=[products[0],products[1],products[3],products[6],products[5],products[2]].map(productCard).join('');
const shopDialog=$('#shopDialog'),productDialog=$('#productDialog'),cartDialog=$('#cartDialog'),searchDialog=$('#searchDialog');
const openModal=dialog=>{if(!dialog.open)dialog.showModal();}; const closeModal=dialog=>{if(dialog.open)dialog.close();};
function renderShop(){
  const categories=['All',...new Set(products.map(product=>product.category))];
  $('#filters').innerHTML=categories.map(category=>`<button class="filter-chip" aria-pressed="${state.filter===category}" data-filter="${category}">${category}</button>`).join('');
  const shown=state.filter==='All'?products:products.filter(product=>product.category===state.filter);
  $('#shopGrid').innerHTML=shown.map(product=>`<button class="shop-item" data-product="${product.id}"><img src="${product.image}" alt="" loading="lazy"><div><h3>${product.name}</h3><span>${product.category} · demo concept</span></div></button>`).join('');
  $$('[data-filter]').forEach(button=>button.onclick=()=>{state.filter=button.dataset.filter;renderShop();});
}
function openProduct(id){
  state.selected=products.find(product=>product.id===id); if(!state.selected)return; state.qty=1;
  $('#productImage').src=state.selected.image; $('#productImage').alt=state.selected.name;
  $('#productTitle').textContent=state.selected.name; $('#productDescription').textContent=state.selected.description; $('#qty').value=1;
  $('#productStyle').textContent=state.selected.style; $('#productPresentation').textContent=state.selected.presentation;
  closeModal(shopDialog); closeModal(searchDialog); openModal(productDialog);
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-product]');if(target)openProduct(target.dataset.product);});
$$('[data-view-shop]').forEach(button=>button.onclick=()=>{renderShop();openModal(shopDialog);});
function renderSearch(query=''){
  const term=query.trim().toLowerCase();
  const matches=products.filter(product=>!term||`${product.name} ${product.category} ${product.description}`.toLowerCase().includes(term));
  $('#searchResults').innerHTML=matches.length?matches.map(product=>`<button class="search-result" data-product="${product.id}"><img src="${product.image}" alt=""><span><small>${product.category}</small><strong>${product.name}</strong></span><svg class="direction-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></button>`).join(''):`<p class="search-empty">No candies match “${query.replace(/[<>&]/g,'')}”. Try fudge, chocolate, cookies, or lollipops.</p>`;
}
$$('[data-open-search]').forEach(button=>button.onclick=()=>{renderSearch('');openModal(searchDialog);requestAnimationFrame(()=>$('#candySearch').focus());});
$('#candySearch').addEventListener('input',event=>renderSearch(event.target.value));
$$('[data-close-search]').forEach(button=>button.onclick=()=>closeModal(searchDialog));
$$('[data-close-dialog]').forEach(button=>button.onclick=()=>closeModal(shopDialog));
$$('[data-close-product]').forEach(button=>button.onclick=()=>closeModal(productDialog));
$$('[data-open-cart]').forEach(button=>button.onclick=()=>{renderCart();openModal(cartDialog);});
$$('[data-close-cart]').forEach(button=>button.onclick=()=>closeModal(cartDialog));
[shopDialog,productDialog,cartDialog,searchDialog].forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
$('#qtyMinus').onclick=()=>{$('#qty').value=state.qty=Math.max(1,state.qty-1);}; $('#qtyPlus').onclick=()=>{$('#qty').value=state.qty=Math.min(9,state.qty+1);};
$('#addProduct').onclick=()=>{addToCart(state.selected,state.qty);closeModal(productDialog);renderCart();openModal(cartDialog);};
function addToCart(product,qty=1){const found=state.cart.find(item=>item.id===product.id);if(found)found.qty+=qty;else state.cart.push({id:product.id,name:product.name,image:product.image,qty});saveCart();}
function saveCart(){localStorage.setItem('mmc-cart-v3',JSON.stringify(state.cart));$$('[data-cart-count]').forEach(element=>element.textContent=state.cart.reduce((total,item)=>total+item.qty,0));}
function renderCart(){
  if(!state.cart.length){$('#cartItems').innerHTML='<div class="cart-empty"><strong>Your candy bag is waiting.</strong><p>Add a demo product or build a box to try the experience.</p></div>';return;}
  $('#cartItems').innerHTML=state.cart.map((item,index)=>`<div class="cart-row"><img src="${item.image}" alt=""><div><h3>${item.name}</h3><button data-remove="${index}">Remove</button></div><strong>× ${item.qty}</strong></div>`).join('');
  $$('[data-remove]').forEach(button=>button.onclick=()=>{state.cart.splice(Number(button.dataset.remove),1);saveCart();renderCart();});
}
$('#demoCheckout').onclick=()=>alert('This is a visual demo only. No order was placed. Call 603-520-5928 for current ordering details.');
const boxCandies=[products[0],products[1],products[2],products[3],products[5],products[6]];
function renderBuilder(){
  $('#sizeOptions').innerHTML=[6,9,12].map(size=>`<button class="choice" aria-pressed="${state.boxSize===size}" data-size="${size}">${size}-piece</button>`).join('');
  $('#candyOptions').innerHTML=boxCandies.map(product=>`<button class="choice candy-choice" aria-pressed="false" data-candy="${product.id}"><img src="${product.image}" alt=""><span>${product.name}</span></button>`).join('');renderBox();
  $$('[data-size]').forEach(button=>button.onclick=()=>{state.boxSize=Number(button.dataset.size);state.box=state.box.slice(0,state.boxSize);renderBuilder();});
  $$('[data-candy]').forEach(button=>button.onclick=()=>{if(state.box.length<state.boxSize){state.box.push(products.find(product=>product.id===button.dataset.candy));renderBox();}});
}
function renderBox(){
  $('#boxCount').textContent=`${state.box.length} / ${state.boxSize}`; $('#candyBox').style.gridTemplateColumns=`repeat(${state.boxSize===12?4:3},1fr)`;
  $('#candyBox').innerHTML=state.box.map((product,index)=>`<div class="box-candy"><img src="${product.image}" alt="${product.name}"><button data-box-remove="${index}" aria-label="Remove ${product.name}">Remove</button></div>`).join('');
  $$('[data-box-remove]').forEach(button=>button.onclick=()=>{state.box.splice(Number(button.dataset.boxRemove),1);renderBox();});
}
$('#addBox').onclick=()=>{if(!state.box.length){$('#boxCount').textContent='Choose a sweet first';return;}addToCart({id:`box-${state.boxSize}`,name:`Build Your Own ${state.boxSize}-Piece Box`,image:'assets/assortment-box-v2.png'});state.box=[];renderBox();renderCart();openModal(cartDialog);};
$('#year').textContent=new Date().getFullYear(); setHero(0,false,false); scheduleHero(); saveCart(); renderBuilder();
