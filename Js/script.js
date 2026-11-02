/* =========================================================
   UrbanNest - site-wide script (js/script.js)
   1. Mobile navigation toggle (all pages)
   2. Leaflet branch map on the Contact page
   3. Gallery page: category filter pills + full-screen photo viewer
   ========================================================= */
(function () {
  'use strict';

  /* ---- 1. Mobile menu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.classList.toggle('is-active', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 600) setOpen(false); });
  }

  /* Leaflet is loaded only when a map is needed, so a slow or blocked
     connection to the Leaflet host can never hold up the rest of the page. */
  function loadLeaflet(done) {
    if (window.L) { done(); return; }
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = done;
    js.onerror = done;
    document.head.appendChild(js);
  }

  /* ---- 2. Branch map (Contact page) ---- */
  var mapEl = document.querySelector('[data-branch-map]');
  if (mapEl) {
    loadLeaflet(function () {
      if (!window.L) {
        mapEl.textContent = 'The map could not load. Please use the Google Maps link below.';
        return;
      }
      var lat = parseFloat(mapEl.getAttribute('data-lat'));
      var lng = parseFloat(mapEl.getAttribute('data-lng'));
      var map = L.map(mapEl, { scrollWheelZoom: false }).setView([lat, lng], 14);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      L.marker([lat, lng]).addTo(map)
        .bindPopup('<strong>' + mapEl.getAttribute('data-label') + '</strong><br>' + mapEl.getAttribute('data-address'))
        .openPopup();
    });
  }

  /* ---- 3. Gallery: filter pills + full-screen viewer ---- */
  var galleryGrid = document.querySelector('[data-gallery-grid]');
  if (galleryGrid) {
    var items = Array.prototype.slice.call(galleryGrid.querySelectorAll('.gallery-item'));
    var pills = Array.prototype.slice.call(document.querySelectorAll('[data-gallery-filters] button'));
    var NAMES = { 'all photos': '', 'living areas': 'living', 'kitchens': 'kitchen', 'bedrooms': 'bedroom', 'exteriors': 'exterior' };

    var emptyNote = document.createElement('p');
    emptyNote.className = 'empty-state';
    emptyNote.textContent = 'No photos in this category yet. Try another one.';
    emptyNote.hidden = true;
    galleryGrid.appendChild(emptyNote);

    var categoryOf = function (pill) {
      if (pill.hasAttribute('data-filter')) return pill.getAttribute('data-filter');
      var name = pill.textContent.trim().toLowerCase();
      return NAMES.hasOwnProperty(name) ? NAMES[name] : '';
    };

    var applyFilter = function (category) {
      var shown = 0;
      items.forEach(function (item) {
        var match = !category || item.getAttribute('data-category') === category;
        item.hidden = !match;
        item.style.display = match ? '' : 'none';   /* belt and braces: works even if the [hidden] CSS rule is missing */
        if (match) shown++;
      });
      emptyNote.hidden = shown > 0;
    };

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        pills.forEach(function (other) {
          var on = other === pill;
          other.classList.toggle('is-active', on);
          other.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        applyFilter(categoryOf(pill));
      });
    });

    /* full-screen viewer: browses only the photos the active pill is showing */
    var overlay = null, viewImg, viewCaption, closeBtn, prevBtn, nextBtn;
    var photos = [], current = 0, opener = null;

    var showPhoto = function () {
      var p = photos[current];
      if (!p) return;
      viewImg.src = p.src;
      viewImg.alt = p.alt;
      viewCaption.textContent = p.caption;
      var many = photos.length > 1;
      prevBtn.hidden = !many;
      nextBtn.hidden = !many;
    };
    var step = function (dir) {
      if (photos.length < 2) return;
      current = (current + dir + photos.length) % photos.length;
      showPhoto();
    };
    var closeViewer = function () {
      if (!overlay) return;
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      if (opener) opener.focus();
    };
    var buildViewer = function () {
      overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Photo viewer');
      overlay.innerHTML =
        '<button class="lightbox-close" type="button" aria-label="Close photo viewer">&times;</button>' +
        '<button class="lightbox-prev" type="button" aria-label="Previous photo">&#10094;</button>' +
        '<img class="lightbox-image" alt="">' +
        '<button class="lightbox-next" type="button" aria-label="Next photo">&#10095;</button>' +
        '<p class="lightbox-caption"></p>';
      document.body.appendChild(overlay);
      viewImg = overlay.querySelector('.lightbox-image');
      viewCaption = overlay.querySelector('.lightbox-caption');
      closeBtn = overlay.querySelector('.lightbox-close');
      prevBtn = overlay.querySelector('.lightbox-prev');
      nextBtn = overlay.querySelector('.lightbox-next');
      closeBtn.addEventListener('click', closeViewer);
      prevBtn.addEventListener('click', function () { step(-1); });
      nextBtn.addEventListener('click', function () { step(1); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) closeViewer(); });
      document.addEventListener('keydown', function (e) {
        if (!overlay.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeViewer();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
      });
    };
    var openViewer = function (list, index, from) {
      if (!overlay) buildViewer();
      photos = list;
      current = index;
      opener = from || null;
      showPhoto();
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };

    galleryGrid.addEventListener('click', function (e) {
      var link = e.target.closest('a[data-lightbox]');
      if (!link) return;
      e.preventDefault();
      var visible = items.filter(function (item) { return !item.hidden; });
      var list = visible.map(function (item) {
        var a = item.querySelector('a[data-lightbox]');
        var img = item.querySelector('img');
        return {
          src: a.getAttribute('href'),
          alt: img ? img.alt : '',
          caption: a.getAttribute('data-caption') || (img ? img.alt : '')
        };
      });
      openViewer(list, Math.max(0, visible.indexOf(link.closest('.gallery-item'))), link);
    });

    /* lets any other script open the same viewer */
    window.UrbanNestLightbox = { open: function (list, index) { openViewer(list, index || 0, null); } };
  }
})();
/* =========================================================
   UrbanNest - form handling (js/forms.js)  [FIXED]
   - Per-field validation with clear messages (name, email, SA phone,
     message length, dates not in the past, required selects)
   - Sends through the form's action URL, then shows a success panel
   - Enquiry form: success panel shows cost + availability for the
     chosen property, taken from js/properties-data.js
   - If sending fails, offers a ready-made email (mailto) instead
   - Fills the "Property of Interest" dropdown from the shared data
   Load order on the enquiry page: properties-data.js, script.js, forms.js
   ========================================================= */
(function () {
  'use strict';

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE = /^(0\d{9}|\+27\d{9})$/;
  var NAME = /^[A-Za-z\u00C0-\u024F'’\- ]{2,60}$/;
  var CAT = { buy: 'For Sale', rent: 'To Rent', development: 'New Development' };
  var TYPE = { house: 'House', apartment: 'Apartment', townhouse: 'Townhouse', studio: 'Studio', mixed: 'Mixed Use' };

  function money(n) { return 'R' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  /* --- validation --------------------------------------------- */

  function messageFor(field) {
    var value = (field.value || '').trim();
    var required = field.hasAttribute('required');

    if (!value) { return required ? (field.tagName === 'SELECT' ? 'Please choose an option.' : 'Please fill in this field.') : ''; }

    if (field.name === 'name' && !NAME.test(value)) return 'Enter your full name (letters only, at least 2 characters).';
    if (field.type === 'email' && !EMAIL.test(value)) return 'Enter a valid email address, e.g. name@example.com.';
    if (field.type === 'tel' && !PHONE.test(value.replace(/[\s\-()]/g, ''))) return 'Enter a valid South African number, e.g. 082 123 4567 or +27 82 123 4567.';
    if (field.tagName === 'TEXTAREA' && value.length < 10) return 'Please write at least 10 characters so we can help.';
    if (field.type === 'date' && value < todayISO()) return 'Choose today or a future date.';
    return '';
  }

  function errorElement(field) {
    var id = field.id + '-error';
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('span');
      el.id = id;
      el.className = 'field-error';
      el.setAttribute('role', 'alert');
      field.insertAdjacentElement('afterend', el);
      field.setAttribute('aria-describedby', id);
    }
    return el;
  }

  function checkField(field) {
    var message = messageFor(field);
    errorElement(field).textContent = message;
    field.classList.toggle('is-invalid', !!message);
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  function validate(form) {
    var invalid = [];
    Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (field) {
      if (field.type === 'hidden') return;
      if (!checkField(field)) invalid.push(field);
    });
    return invalid;
  }

  /* --- status + email fallback --------------------------------- */

  function setStatus(el, message, isError) {
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || '';
    el.classList.toggle('is-error', !!isError);
  }

  function prettyName(name) {
    return name.replace(/_/g, ' ').replace(/^\w/, function (c) { return c.toUpperCase(); });
  }

  function mailtoFor(form) {
    var match = (form.getAttribute('action') || '').match(/ajax\/([^\/?#]+)/);
    var to = match ? match[1] : 'rendzorikhotso16@gmail.com';
    var subjectField = form.querySelector('[name="_subject"]');
    var subject = subjectField ? subjectField.value : 'Message from the UrbanNest website';
    var lines = [];
    Array.prototype.forEach.call(form.elements, function (f) {
      if (!f.name || f.name.charAt(0) === '_' || !f.value) return;
      lines.push(prettyName(f.name) + ': ' + f.value);
    });
    return 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function showFailure(statusEl, form) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.classList.add('is-error');
    statusEl.textContent = 'Sorry, your message could not be sent from this page. ';
    var link = document.createElement('a');
    link.href = mailtoFor(form);
    link.textContent = 'Send it from your email app instead';
    statusEl.appendChild(link);
    statusEl.appendChild(document.createTextNode(', or call 0634373969.'));
  }

  /* --- enquiry response: cost + availability ------------------- */

  function addRow(list, label, value) {
    var li = document.createElement('li');
    var k = document.createElement('span'); k.className = 'k'; k.textContent = label;
    var v = document.createElement('span'); v.className = 'v'; v.textContent = value;
    li.appendChild(k); li.appendChild(v);
    list.appendChild(li);
  }

  function fillDetails(listEl, form) {
    if (!listEl) return;
    listEl.innerHTML = '';

    var typeSelect = form.elements.property;
    var listingSelect = form.elements.listing;
    var option = listingSelect && listingSelect.selectedOptions[0];
    var ref = option && option.getAttribute('data-ref');
    var item = (window.URBANNEST_PROPERTIES || []).filter(function (p) { return p.id === ref; })[0];

    if (typeSelect && typeSelect.value) addRow(listEl, 'Property type', typeSelect.value);

    if (item) {
      addRow(listEl, 'Listing', item.name + ', ' + item.suburb);
      var price = window.urbanNestPrice ? window.urbanNestPrice(item) : money(item.price);
      addRow(listEl, item.cat === 'rent' ? 'Monthly rent' : 'Price', price);
      if (item.cat === 'rent') {
        addRow(listEl, 'Deposit (one month)', money(item.price));
        addRow(listEl, 'Due on move-in', money(item.price * 2));
      } else if (item.cat === 'buy') {
        addRow(listEl, 'Indicative 10% deposit', money(item.price * 0.1));
      } else if (item.status) {
        addRow(listEl, 'Development stage', item.status);
      }
      addRow(listEl, 'Availability',
        item.sold ? 'Sold. We will suggest similar indexs.' :
        item.underOffer ? 'Under offer. We will tell you if it becomes available.' :
        item.cat === 'development' ? 'Open for registrations of interest' :
        'Available. We will confirm viewing times.');
    } else {
      addRow(listEl, 'Cost', 'We will email current prices for this type of property.');
      addRow(listEl, 'Availability', 'We will confirm what is available and offer viewing times.');
    }

    ['enquiry_type', 'viewing_date'].forEach(function (name) {
      var field = form.elements[name];
      if (field && field.value) addRow(listEl, prettyName(name).replace('Viewing date', 'Preferred viewing date'), field.value);
    });
  }

  /* --- Specific listing dropdown (optional) ---------------------- */
  /* Property of Interest (the type list) is fixed HTML; this fills the
     optional "Specific Listing" list from js/properties-data.js. */

  var TYPE_OPTION = {
    house: 'House / Detached index', apartment: 'Apartment / Flat',
    townhouse: 'Townhouse / Duplex', studio: 'Studio Apartment'
  };

  function populateListings() {
    var select = document.getElementById('e-listing');
    var data = window.URBANNEST_PROPERTIES || [];
    if (!select) return;

    while (select.options.length > 1) { select.remove(1); }

    var groups = {}, order = [];
    data.forEach(function (p) {
      if (!groups[p.city]) {
        groups[p.city] = document.createElement('optgroup');
        groups[p.city].label = p.city;
        order.push(p.city);
      }
      var option = document.createElement('option');
      /* "Rosebank Loft" exists for sale and to rent, so the category is part of the value */
      option.value = p.name + ' (' + CAT[p.cat] + ')';
      option.textContent = p.name + ' — ' + p.beds + ' Bed ' + TYPE[p.type] + ' · ' + CAT[p.cat];
      option.setAttribute('data-ref', p.id);
      groups[p.city].appendChild(option);
    });
    order.forEach(function (city) { select.appendChild(groups[city]); });

    /* Arriving from a property card: enquiry.html?property=Name&ref=buy-01 */
    var params = new URLSearchParams(window.location.search);
    var ref = params.get('ref'), name = params.get('property');
    var match = null;
    if (ref) {
      Array.prototype.forEach.call(select.options, function (o) { if (o.getAttribute('data-ref') === ref) match = o; });
    }
    if (!match && name) {
      Array.prototype.forEach.call(select.options, function (o) { if (!match && o.value.indexOf(name) === 0) match = o; });
    }
    if (match) {
      select.value = match.value;
      var item = data.filter(function (p) { return p.id === match.getAttribute('data-ref'); })[0];
      var typeSelect = document.getElementById('e-property');
      if (item && typeSelect) {
        typeSelect.value = item.cat === 'development' ? 'New Development / Off-Plan Project' : (TYPE_OPTION[item.type] || '');
      }
    }
  }

  /* If the page forgot to load js/properties-data.js, load it here first. */
  function withListings(callback) {
    if (window.URBANNEST_PROPERTIES && window.URBANNEST_PROPERTIES.length) { callback(); return; }
    var script = document.createElement('script');
    script.src = 'js/properties-data.js';
    script.onload = callback;
    script.onerror = callback;
    document.head.appendChild(script);
  }

  /* --- submit -------------------------------------------------- */

  function handleSubmit(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var statusEl = form.querySelector('[data-form-status]');
    var isEnquiry = form.hasAttribute('data-enquiry-form');
    var successEl = document.querySelector(isEnquiry ? '[data-enquiry-response]' : '[data-contact-response]');
    var detailsEl = successEl ? successEl.querySelector('[data-response-details]') : null;

    setStatus(statusEl, '', false);

    var invalid = validate(form);
    if (invalid.length) {
      setStatus(statusEl, 'Please correct the ' + (invalid.length === 1 ? 'field' : invalid.length + ' fields') + ' marked in red.', true);
      invalid[0].focus();
      return;
    }

    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('is-sending'); }
    setStatus(statusEl, 'Sending...', false);

    var payload = new FormData(form);
    payload.append('_page', window.location.href);
    payload.append('_submitted', new Date().toLocaleString());

    fetch(form.getAttribute('action'), {
      method: form.getAttribute('method') || 'POST',
      body: payload,
      headers: { 'Accept': 'application/json' }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Server responded with ' + response.status);
        return response.json().catch(function () { return {}; });
      })
      .then(function () {
        if (isEnquiry) fillDetails(detailsEl, form);   /* read values BEFORE the reset */
        form.reset();
        Array.prototype.forEach.call(form.querySelectorAll('.is-invalid'), function (f) { f.classList.remove('is-invalid'); });
        Array.prototype.forEach.call(form.querySelectorAll('.field-error'), function (e) { e.textContent = ''; });
        setStatus(statusEl, '', false);
        if (successEl) {
          form.hidden = true;
          successEl.hidden = false;
          successEl.focus();
        }
      })
      .catch(function (error) {
        showFailure(statusEl, form);
        if (window.console) console.error('Form submission failed:', error);
      })
      .then(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove('is-sending'); }
      });
  }

  /* --- "send another" ------------------------------------------ */

  function handleReset(button) {
    var successEl = button.closest('.form-success');
    var form = successEl && successEl.parentNode.querySelector('form');
    if (!form) return;
    successEl.hidden = true;
    form.hidden = false;
    form.reset();
    setStatus(form.querySelector('[data-form-status]'), '', false);
    var first = form.querySelector('input:not([type="hidden"]), select, textarea');
    if (first) first.focus();
  }

  /* --- wire up -------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('e-listing')) { withListings(populateListings); }

    Array.prototype.forEach.call(document.querySelectorAll('[data-enquiry-form], [data-contact-form]'), function (form) {
      form.addEventListener('submit', handleSubmit);
      form.addEventListener('focusout', function (e) {
        if (e.target.matches && e.target.matches('input, select, textarea') && e.target.type !== 'hidden') checkField(e.target);
      });
      form.addEventListener('input', function (e) {
        if (e.target.classList && e.target.classList.contains('is-invalid')) checkField(e.target);
      });
      Array.prototype.forEach.call(form.querySelectorAll('input[type="date"]'), function (d) { d.min = todayISO(); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-form-reset]'), function (button) {
      button.addEventListener('click', function () { handleReset(button); });
    });
  });
})();
/* =========================================================
   UrbanNest - Properties portal (js/properties.js)  [FIXED]
   Needs js/properties-data.js loaded first.
   ========================================================= */
/* ---------------------------------------------------------
   BUILT-IN COPY of the 60 listings (20 for sale, 20 to rent, 20 developments).
   It is used ONLY when js/properties-data.js is missing, empty or fails to
   load, so the Properties page never ends up blank. When js/properties-data.js
   loads normally, that file wins, so keep editing your listings there.
   --------------------------------------------------------- */
(function () {
  if (window.URBANNEST_PROPERTIES && window.URBANNEST_PROPERTIES.length) { return; }
  if (window.console) { console.warn('UrbanNest: js/properties-data.js was not found, using the built-in listings.'); }
  window.URBANNEST_PROPERTIES = [


  /* ---------------- FOR SALE (20) ---------------- */
  { id:'buy-01',photos:22, cat:'buy', city:'Johannesburg', suburb:'Rosebank', name:'Rosebank Loft', type:'apartment', beds:1, baths:1, park:1, parkType:'Basement', floor:52, erf:0, price:1150000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'rosebank-loft' },
  { id:'buy-02',photos:24, cat:'buy', city:'Johannesburg', suburb:'Sandton', name:'Sandton View', type:'apartment', beds:2, baths:2, park:2, parkType:'Basement', floor:88, erf:0, price:2450000, feat:['pool','petFriendly','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'sandton-view' },
  { id:'buy-03',photos:26, cat:'buy', city:'Johannesburg', suburb:'Melrose', name:'Melrose Court', type:'townhouse', beds:3, baths:2, park:2, parkType:'Garage', floor:145, erf:180, price:3200000, feat:['garden','petFriendly'], flags:['securityEstate'], underOffer:false, sold:true, slug:'melrose-court' },
  { id:'buy-04',photos:35, cat:'buy', city:'Johannesburg', suburb:'Bryanston', name:'Bryanston Grove', type:'house', beds:4, baths:3, park:3, parkType:'Garage', floor:320, erf:890, price:4850000, feat:['garden','pool','petFriendly','flatlet'], flags:['securityEstate'], underOffer:false, sold:false, slug:'bryanston-grove' },
  { id:'buy-05',photos:33, cat:'buy', city:'Johannesburg', suburb:'Parkhurst', name:'Parkhurst Mews', type:'townhouse', beds:2, baths:2, park:2, parkType:'Carport', floor:112, erf:140, price:2100000, feat:['garden','petFriendly'], flags:[], underOffer:true, sold:false, slug:'parkhurst-mews' },
  { id:'buy-06',photos:13, cat:'buy', city:'Pretoria', suburb:'Menlyn', name:'Menlyn Gate', type:'apartment', beds:2, baths:2, park:1, parkType:'Open Bay', floor:79, erf:0, price:1650000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'menlyn-gate' },
  { id:'buy-07',photos:62, cat:'buy', city:'Pretoria', suburb:'Waterkloof', name:'Waterkloof Ridge', type:'house', beds:4, baths:4, park:4, parkType:'Garage', floor:410, erf:1200, price:5400000, feat:['garden','pool','flatlet'], flags:['securityEstate'], underOffer:false, sold:false, slug:'waterkloof-ridge' },
  { id:'buy-08',photos:15, cat:'buy', city:'Pretoria', suburb:'Hatfield', name:'Hatfield Studio', type:'studio', beds:1, baths:1, park:1, parkType:'Open Bay', floor:38, erf:0, price:780000, feat:[], flags:[], underOffer:false, sold:false, slug:'hatfield-studio' },
  { id:'buy-09',photos:33, cat:'buy', city:'Pretoria', suburb:'Centurion', name:'Centurion Park', type:'house', beds:3, baths:2, park:2, parkType:'Garage', floor:205, erf:600, price:2850000, feat:['garden','petFriendly','pool'], flags:[], underOffer:false, sold:false, slug:'centurion-park' },
  { id:'buy-10',photos:8, cat:'buy', city:'Pretoria', suburb:'Lynnwood', name:'Lynnwood Glen', type:'townhouse', beds:3, baths:2, park:2, parkType:'Garage', floor:158, erf:210, price:2300000, feat:['garden','pool','petFriendly'], flags:['securityEstate','retirement'], underOffer:false, sold:false, slug:'lynnwood-glen' },
  { id:'buy-11',photos:20, cat:'buy', city:'Cape Town', suburb:'Sea Point', name:'Sea Point Terrace', type:'apartment', beds:2, baths:2, park:1, parkType:'Basement', floor:96, erf:0, price:3450000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'sea-point-terrace' },
  { id:'buy-12',photos:39, cat:'buy', city:'Cape Town', suburb:'Claremont', name:'Claremont House', type:'house', beds:3, baths:3, park:2, parkType:'Garage', floor:240, erf:520, price:4200000, feat:['garden','pool','petFriendly','flatlet'], flags:[], underOffer:false, sold:false, slug:'claremont-house' },
  { id:'buy-13',photos:16, cat:'buy', city:'Cape Town', suburb:'Century City', name:'Century City Loft', type:'apartment', beds:1, baths:1, park:1, parkType:'Basement', floor:58, erf:0, price:1780000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'century-city-loft' },
  { id:'buy-14',photos:34, cat:'buy', city:'Cape Town', suburb:'Camps Bay', name:'Camps Bay Vista', type:'house', beds:4, baths:5, park:4, parkType:'Garage', floor:480, erf:950, price:9750000, feat:['garden','pool','flatlet'], flags:['securityEstate'], underOffer:false, sold:false, slug:'camps-bay-vista' },
  { id:'buy-15',photos:19, cat:'buy', city:'Cape Town', suburb:'Observatory', name:'Observatory Row', type:'apartment', beds:2, baths:2, park:2, parkType:'Off-street', floor:118, erf:165, price:2650000, feat:['garden','petFriendly','flatlet'], flags:[], underOffer:true, sold:false, slug:'observatory-row' },
  { id:'buy-16',photos:21, cat:'buy', city:'Durban', suburb:'Umhlanga', name:'Umhlanga Sands', type:'apartment', beds:3, baths:2, park:2, parkType:'Basement', floor:132, erf:0, price:3100000, feat:['pool','securityEstate'], flags:['securityEstate','auction'], underOffer:false, sold:false, slug:'umhlanga-sands' },
  { id:'buy-17',photos:47, cat:'buy', city:'Durban', suburb:'Morningside', name:'Morningside Villa', type:'house', beds:4, baths:3, park:3, parkType:'Garage', floor:350, erf:780, price:4600000, feat:['garden','pool','petFriendly'], flags:['securityEstate'], underOffer:false, sold:false, slug:'morningside-villa' },
  { id:'buy-18',photos:17, cat:'buy', city:'Durban', suburb:'Ballito', name:'Ballito Bay', type:'apartment', beds:2, baths:2, park:1, parkType:'Open Bay', floor:84, erf:0, price:1950000, feat:['pool','petFriendly','securityEstate'], flags:['securityEstate','repossessed'], underOffer:false, sold:false, slug:'ballito-bay' },
  { id:'buy-19',photos:34, cat:'buy', city:'Durban', suburb:'Berea', name:'Berea Heights', type:'house', beds:3, baths:2, park:2, parkType:'Carport', floor:215, erf:640, price:2700000, feat:['garden','flatlet'], flags:[], underOffer:false, sold:true, slug:'berea-heights' },
  { id:'buy-20',photos:10, cat:'buy', city:'Durban', suburb:'Westville', name:'Westville Park', type:'townhouse', beds:4, baths:3, park:2, parkType:'Garage', floor:265, erf:320, price:3650000, feat:['garden','pool','petFriendly'], flags:['securityEstate','onShow'], underOffer:false, sold:false, slug:'westville-park' },

  /* ---------------- TO RENT (20) ---------------- */
  { id:'rent-01',photos:13, cat:'rent', city:'Johannesburg', suburb:'Greenside', name:'Greenside Loft', type:'apartment', beds:1, baths:1, park:1, parkType:'Basement', floor:52, erf:0, price:9500, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'greenside-loft' },
  { id:'rent-02',photos:26, cat:'rent', city:'Johannesburg', suburb:'Fourways', name:'Fourways Square', type:'apartment', beds:2, baths:2, park:2, parkType:'Basement', floor:88, erf:0, price:16500, feat:['pool','petFriendly','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'fourways-square' },
  { id:'rent-03',photos:19, cat:'rent', city:'Johannesburg', suburb:'Linden', name:'Linden Terrace', type:'townhouse', beds:3, baths:2, park:2, parkType:'Garage', floor:145, erf:180, price:22000, feat:['garden','petFriendly'], flags:['securityEstate'], underOffer:false, sold:false, slug:'linden-terrace' },
  { id:'rent-04',photos:27, cat:'rent', city:'Johannesburg', suburb:'Randburg', name:'Randburg Manor', type:'house', beds:4, baths:3, park:3, parkType:'Garage', floor:320, erf:890, price:32000, feat:['garden','pool','petFriendly','flatlet'], flags:['securityEstate'], underOffer:false, sold:false, slug:'randburg-manor' },
  { id:'rent-05',photos:29, cat:'rent', city:'Johannesburg', suburb:'Maboneng', name:'Maboneng Studio', type:'studio', beds:1, baths:1, park:1, parkType:'Open Bay', floor:34, erf:0, price:6800, feat:[], flags:[], underOffer:false, sold:false, slug:'maboneng-studio' },
  { id:'rent-06',photos:20, cat:'rent', city:'Pretoria', suburb:'Brooklyn', name:'Brooklyn Place', type:'apartment', beds:2, baths:2, park:1, parkType:'Open Bay', floor:79, erf:0, price:12500, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'brooklyn-place' },
  { id:'rent-07',photos:20, cat:'rent', city:'Pretoria', suburb:'Garsfontein', name:'Garsfontein Villa', type:'house', beds:5, baths:3, park:2, parkType:'Garage', floor:410, erf:1200, price:28500, feat:['garden','pool','flatlet'], flags:['securityEstate'], underOffer:false, sold:false, slug:'garsfontein-villa' },
  { id:'rent-08',photos:24, cat:'rent', city:'Pretoria', suburb:'Sunnyside', name:'Sunnyside Studio', type:'studio', beds:1, baths:1, park:1, parkType:'Open Bay', floor:38, erf:0, price:5900, feat:['petFriendly'], flags:[], underOffer:false, sold:false, slug:'sunnyside-studio' },
  { id:'rent-09',photos:44, cat:'rent', city:'Pretoria', suburb:'Moreleta Park', name:'Moreleta Haven', type:'house', beds:3, baths:2, park:2, parkType:'Garage', floor:205, erf:600, price:18900, feat:['garden','petFriendly','pool'], flags:[], underOffer:false, sold:false, slug:'moreleta-haven' },
  { id:'rent-10',photos:18, cat:'rent', city:'Pretoria', suburb:'Arcadia', name:'Arcadia Mews', type:'townhouse', beds:3, baths:2, park:2, parkType:'Garage', floor:158, erf:210, price:15400, feat:['garden','pool','petFriendly'], flags:['securityEstate','retirement'], underOffer:false, sold:false, slug:'arcadia-mews' },
  { id:'rent-11',photos:13, cat:'rent', city:'Cape Town', suburb:'Green Point', name:'Green Point Heights', type:'apartment', beds:2, baths:2, park:1, parkType:'Basement', floor:96, erf:0, price:21000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'green-point-heights' },
  { id:'rent-12',photos:25, cat:'rent', city:'Cape Town', suburb:'Rondebosch', name:'Rondebosch Lodge', type:'house', beds:3, baths:3, park:2, parkType:'Garage', floor:240, erf:520, price:26500, feat:['garden','pool','petFriendly','flatlet'], flags:[], underOffer:false, sold:false, slug:'rondebosch-lodge' },
  { id:'rent-13',photos:12, cat:'rent', city:'Cape Town', suburb:'Gardens', name:'Gardens Loft', type:'apartment', beds:1, baths:1, park:1, parkType:'Basement', floor:58, erf:0, price:11800, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:true, sold:false, slug:'gardens-loft' },
  { id:'rent-14',photos:29, cat:'rent', city:'Cape Town', suburb:'Tamboerskloof', name:'Tamboerskloof Villa', type:'house', beds:3, baths:3, park:1, parkType:'Garage', floor:480, erf:950, price:48000, feat:['garden','pool','flatlet'], flags:['securityEstate'], underOffer:false, sold:false, slug:'tamboerskloof-villa' },
  { id:'rent-15',photos:15, cat:'rent', city:'Cape Town', suburb:'Woodstock', name:'Woodstock Row', type:'townhouse', beds:2, baths:2, park:2, parkType:'Off-street', floor:118, erf:165, price:17200, feat:['garden','petFriendly','flatlet'], flags:[], underOffer:false, sold:false, slug:'woodstock-row' },
  { id:'rent-16',photos:15, cat:'rent', city:'Durban', suburb:'Glenwood', name:'Glenwood Heights', type:'apartment', beds:3, baths:2, park:2, parkType:'Basement', floor:132, erf:0, price:19500, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'glenwood-heights' },
  { id:'rent-17',photos:16, cat:'rent', city:'Durban', suburb:'Kloof', name:'Kloof Manor', type:'house', beds:4, baths:4, park:3, parkType:'Garage', floor:350, erf:780, price:75000, feat:['garden','pool','petFriendly'], flags:['securityEstate'], underOffer:false, sold:false, slug:'kloof-manor' },
  { id:'rent-18',photos:18, cat:'rent', city:'Durban', suburb:'Musgrave', name:'Musgrave Court', type:'apartment', beds:2, baths:2, park:1, parkType:'Open Bay', floor:84, erf:0, price:13400, feat:['pool','petFriendly','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, slug:'musgrave-court' },
  { id:'rent-19',photos:16, cat:'rent', city:'Durban', suburb:'Durban North', name:'Durban North Lodge', type:'house', beds:4, baths:3, park:4, parkType:'Carport', floor:215, erf:640, price:35000, feat:['garden','flatlet'], flags:['onShow'], underOffer:false, sold:false, slug:'durban-north-lodge' },
  { id:'rent-20',photos:19, cat:'rent', city:'Durban', suburb:'Umbilo', name:'Umbilo Park', type:'townhouse', beds:4, baths:3, park:2, parkType:'Garage', floor:265, erf:320, price:21500, feat:['garden','pool','petFriendly'], flags:['securityEstate'], underOffer:false, sold:false, slug:'umbilo-park' },

  /* ---------------- NEW DEVELOPMENTS (20) ---------------- */
  { id:'dev-01',photos:21, cat:'development', city:'Johannesburg', suburb:'Braamfontein', name:'Braamfontein Quarter', type:'mixed', beds:1, baths:1, park:1, parkType:'Basement', floor:48, erf:0, price:1450000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, status:'Launching 2027', slug:'braamfontein-quarter' },
  { id:'dev-02',photos:29, cat:'development', city:'Johannesburg', suburb:'Illovo', name:'Illovo Skyline', type:'apartment', beds:2, baths:2, park:2, parkType:'Basement', floor:74, erf:0, price:2650000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, status:'Under construction', slug:'illovo-skyline' },
  { id:'dev-03',photos:32, cat:'development', city:'Johannesburg', suburb:'Northcliff', name:'Northcliff Junction', type:'townhouse', beds:3, baths:2, park:2, parkType:'Garage', floor:128, erf:150, price:3400000, feat:['garden','petFriendly'], flags:['securityEstate','onShow'], underOffer:false, sold:false, status:'Selling off-plan', slug:'northcliff-junction' },
  { id:'dev-04',photos:30, cat:'development', city:'Johannesburg', suburb:'Midrand', name:'Midrand Meadows', type:'house', beds:4, baths:4.5, park:3, parkType:'Garage', floor:260, erf:620, price:5950000, feat:['garden','pool'], flags:['securityEstate'], underOffer:false, sold:false, status:'Launching 2027', slug:'midrand-meadows' },
  { id:'dev-05',photos:11, cat:'development', city:'Johannesburg', suburb:'Waterfall', name:'Waterfall Square', type:'apartment', beds:1, baths:1, park:1, parkType:'Basement', floor:42, erf:0, price:950000, feat:['securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, status:'Under construction', slug:'waterfall-square' },
  { id:'dev-06',photos:14, cat:'development', city:'Pretoria', suburb:'Montana', name:'Montana Ridge', type:'apartment', beds:2, baths:2, park:1, parkType:'Open Bay', floor:68, erf:0, price:1750000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, status:'Under construction', slug:'montana-ridge' },
  { id:'dev-07',photos:29, cat:'development', city:'Pretoria', suburb:'Irene', name:'Irene Estate', type:'house', beds:4, baths:4.5, park:3, parkType:'Garage', floor:340, erf:900, price:5600000, feat:['garden','pool','flatlet'], flags:['securityEstate'], underOffer:false, sold:false, status:'Launching 2027', slug:'irene-estate' },
  { id:'dev-08',photos:23, cat:'development', city:'Pretoria', suburb:'Equestria', name:'Equestria Central', type:'apartment', beds:1, baths:1, park:1, parkType:'Open Bay', floor:39, erf:0, price:890000, feat:['securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, status:'Selling off-plan', slug:'equestria-central' },
  { id:'dev-09',photos:19, cat:'development', city:'Pretoria', suburb:'Faerie Glen', name:'Faerie Glen Square', type:'townhouse', beds:3, baths:2, park:2, parkType:'Garage', floor:122, erf:180, price:2950000, feat:['garden','petFriendly'], flags:['securityEstate'], underOffer:false, sold:false, status:'Under construction', slug:'faerie-glen-square' },
  { id:'dev-10',photos:22, cat:'development', city:'Pretoria', suburb:'Silver Lakes', name:'Silver Lakes Terraces', type:'townhouse', beds:3, baths:2, park:2, parkType:'Garage', floor:116, erf:160, price:2400000, feat:['garden','petFriendly'], flags:['securityEstate','retirement'], underOffer:false, sold:false, status:'Selling off-plan', slug:'silver-lakes-terraces' },
  { id:'dev-11',photos:28, cat:'development', city:'Cape Town', suburb:'Table View', name:'Table View Residences', type:'apartment', beds:2, baths:2, park:1, parkType:'Basement', floor:88, erf:0, price:3600000, feat:['pool','securityEstate'], flags:['securityEstate','onShow'], underOffer:false, sold:false, status:'Launching 2027', slug:'table-view-residences' },
  { id:'dev-12',photos:24, cat:'development', city:'Cape Town', suburb:'Newlands', name:'Newlands Quarter', type:'house', beds:3, baths:3, park:2, parkType:'Garage', floor:205, erf:480, price:2850000, feat:['garden','pool'], flags:['securityEstate'], underOffer:false, sold:false, status:'Under construction', slug:'newlands-quarter' },
  { id:'dev-13',photos:15, cat:'development', city:'Cape Town', suburb:'Bellville', name:'Bellville Towers', type:'apartment', beds:2, baths:1, park:1, parkType:'Basement', floor:54, erf:0, price:1850000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, status:'Selling off-plan', slug:'bellville-towers' },
  { id:'dev-14',photos:32, cat:'development', city:'Cape Town', suburb:'Constantia', name:'Constantia Terraces', type:'house', beds:4, baths:5, park:4, parkType:'Garage', floor:390, erf:850, price:10200000, feat:['garden','pool','flatlet'], flags:['securityEstate'], underOffer:false, sold:false, status:'Launching 2027', slug:'constantia-terraces' },
  { id:'dev-15',photos:28, cat:'development', city:'Cape Town', suburb:'Milnerton', name:'Milnerton Mews', type:'townhouse', beds:3, baths:2, park:3, parkType:'Off-street', floor:104, erf:140, price:2800000, feat:['garden','petFriendly'], flags:[], underOffer:false, sold:false, status:'Under construction', slug:'milnerton-mews' },
  { id:'dev-16',photos:30, cat:'development', city:'Durban', suburb:'La Lucia', name:'La Lucia Coastal', type:'apartment', beds:3, baths:3, park:2, parkType:'Basement', floor:126, erf:0, price:3250000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, status:'Under construction', slug:'la-lucia-coastal' },
  { id:'dev-17',photos:40, cat:'development', city:'Durban', suburb:'Hillcrest', name:'Hillcrest Estate', type:'house', beds:4, baths:4, park:3, parkType:'Garage', floor:300, erf:700, price:4800000, feat:['garden','pool','petFriendly'], flags:['securityEstate'], underOffer:false, sold:false, status:'Launching 2027', slug:'hillcrest-estate' },
  { id:'dev-18',photos:19, cat:'development', city:'Durban', suburb:'Umdloti', name:'Umdloti Ridge', type:'apartment', beds:3, baths:2, park:2, parkType:'Open Bay', floor:80, erf:0, price:3600000, feat:['pool','securityEstate'], flags:['securityEstate'], underOffer:false, sold:false, status:'Selling off-plan', slug:'umdloti-ridge' },
  { id:'dev-19',photos:19, cat:'development', city:'Durban', suburb:'Mount Edgecombe', name:'Mount Edgecombe Gardens', type:'house', beds:3, baths:2, park:2, parkType:'Garage', floor:198, erf:560, price:2850000, feat:['garden','flatlet'], flags:['securityEstate'], underOffer:false, sold:false, status:'Under construction', slug:'mount-edgecombe-gardens' },
  { id:'dev-20',photos:17, cat:'development', city:'Durban', suburb:'Amanzimtoti', name:'Amanzimtoti Green', type:'townhouse', beds:4, baths:4.5, park:4, parkType:'Garage', floor:240, erf:300, price:3800000, feat:['garden','pool','petFriendly'], flags:['securityEstate'], underOffer:false, sold:false, status:'Selling off-plan', slug:'amanzimtoti-green' }
];



  /* Shared price formatter - used by the cards and the enquiry form */
  window.urbanNestPrice = function (p) {
    var digits = String(p.price).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (p.cat === 'development' ? 'From R' : 'R') + digits + (p.cat === 'rent' ? ' p/m' : '');
  };
})();

(function () {
  'use strict';

  var DATA = window.URBANNEST_PROPERTIES || [];
  var PHOTO_COUNT = 5;
  var CATEGORY = {
    buy: { heading: 'indexs for sale' },
    rent: { heading: 'indexs to rent' },
    development: { heading: 'new developments' }
  };
  var TYPE_LABEL = { house: 'House', apartment: 'Apartment', townhouse: 'Townhouse', studio: 'Studio', mixed: 'Mixed Use' };
  var SALE_PRICES = [500000, 750000, 1000000, 1500000, 2000000, 2500000, 3000000, 4000000, 5000000, 6500000, 8000000, 10000000];
  var RENT_PRICES = [5000, 7500, 10000, 12500, 15000, 20000, 25000, 30000, 40000, 50000];

  var state = {
    category: 'all', type: '', beds: '', baths: '', park: '', parkType: '',
    minPrice: '', maxPrice: '', floorMin: '', floorMax: '', erfMin: '', erfMax: '',
    features: [], others: [], excludeUnderOffer: false, excludeSold: false,
    city: '', query: '', sort: ''
  };

  var els = {}, detail = null, view = {}, lastOpener = null, lastBand = null;

  /* ---------------- helpers ---------------- */
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function groupDigits(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function priceLabel(item) {
    return window.urbanNestPrice ? window.urbanNestPrice(item)
      : 'R' + groupDigits(item.price) + (item.cat === 'rent' ? ' p/m' : '');
  }
  function photoPath(slug, i) { return 'images/properties/' + slug + '-' + i + '.jpg'; }

  /* Each property shows 5 photos. It looks for your own files first
     (images/properties/<slug>-1.jpg ... -5.jpg) and falls back to the sample
     photos already used on the Gallery page, then to a grey placeholder. */
  var SAMPLE = { exterior: ['GG', 'HH', 'II', 'LL'], living: ['AA', 'BB', 'JJ'], kitchen: ['CC', 'DD'], bedroom: ['EE', 'FF', 'KK'] };
  var SHOTS = [['exterior', 'Exterior'], ['living', 'Living area'], ['kitchen', 'Kitchen'], ['bedroom', 'Bedroom'], ['living', 'Lounge and dining area']];

  function seed(item) {
    var n = parseInt(String(item.id).replace(/\D/g, ''), 10) || 0;
    return n + (item.cat === 'rent' ? 3 : item.cat === 'development' ? 7 : 0);
  }

  /* how many pictures a property has: the optional "photos" field in the data file, default 5 */
  function photoCount(item) {
    return Math.max(1, Math.min(40, parseInt(item.photos, 10) || PHOTO_COUNT));
  }

  function photosFor(item) {
    var out = [];
    for (var n = 1; n <= photoCount(item); n++) {
      var shot = SHOTS[n - 1] || [['living', 'kitchen', 'bedroom', 'exterior'][n % 4], 'Photo ' + n];
      var pool = SAMPLE[shot[0]];
      var sample = pool[(seed(item) + (n === 5 ? 1 : 0)) % pool.length];
      out.push({ label: shot[1], sources: [photoPath(item.slug, n), 'images/' + sample + '.jpg'] });
    }
    return out;
  }

  function setImage(img, sources, title, subtitle) {
    var i = 0;
    img.onerror = function () {
      i += 1;
      if (i < sources.length) { img.src = sources[i]; }
      else { img.onerror = null; img.src = placeholder(title, subtitle); }
    };
    img.src = sources[0];
  }

  function placeholder(title, subtitle) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560">' +
      '<rect width="800" height="560" fill="#eaeff5"/><path d="M400 148l172 122v192H228V270z" fill="#cbd7e5"/>' +
      '<path d="M400 148l172 122H228z" fill="#b6c5d8"/><rect x="364" y="366" width="72" height="96" fill="#8ea3bb"/>' +
      '<text x="400" y="504" font-family="Arial,sans-serif" font-size="32" fill="#5b6b80" text-anchor="middle">' + esc(title) + '</text>' +
      '<text x="400" y="536" font-family="Arial,sans-serif" font-size="21" fill="#8ea3bb" text-anchor="middle">' + esc(subtitle || '') + '</text></svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  /* FIX: uses onerror (one handler per image) so listeners never pile up */
  function guardImage(img, title, subtitle) {
    if (!img) return;
    function swap() {
      if (img.getAttribute('data-fallback') === '1') return;
      img.setAttribute('data-fallback', '1');
      img.src = placeholder(title, subtitle);
    }
    img.onerror = swap;
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) swap();
  }

  function toggleIn(list, value, on) {
    var i = list.indexOf(value);
    if (on && i === -1) list.push(value);
    if (!on && i !== -1) list.splice(i, 1);
  }

  function activeFilterCount() {
    var n = 0;
    ['type', 'beds', 'baths', 'park', 'parkType', 'minPrice', 'maxPrice', 'floorMin', 'floorMax', 'erfMin', 'erfMax', 'city', 'query']
      .forEach(function (k) { if (state[k]) n++; });
    n += state.features.length + state.others.length;
    if (state.excludeUnderOffer) n++;
    if (state.excludeSold) n++;
    return n;
  }

  function band() { return state.category === 'rent' ? 'rent' : state.category === 'all' ? 'all' : 'sale'; }

  function scrollToResults() {
    var results = document.querySelector('.portal-results');
    if (results) window.scrollTo({ top: results.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
  }

  /* ---------------- matching + sorting ---------------- */
  function matches(item, ignoreCity) {
    var s = state, i;
    if (s.category !== 'all' && item.cat !== s.category) return false;
    if (s.type && item.type !== s.type) return false;
    if (s.beds && item.beds < Number(s.beds)) return false;
    if (s.baths && item.baths < Number(s.baths)) return false;
    if (s.park && item.park < Number(s.park)) return false;
    if (s.parkType && item.parkType !== s.parkType) return false;
    if (s.minPrice && item.price < Number(s.minPrice)) return false;
    if (s.maxPrice && item.price > Number(s.maxPrice)) return false;
    if (s.floorMin && item.floor < Number(s.floorMin)) return false;
    if (s.floorMax && item.floor > Number(s.floorMax)) return false;
    if (s.erfMin && item.erf < Number(s.erfMin)) return false;
    if (s.erfMax && item.erf > Number(s.erfMax)) return false;
    if (s.excludeUnderOffer && item.underOffer) return false;
    if (s.excludeSold && item.sold) return false;
    for (i = 0; i < s.features.length; i++) if (item.feat.indexOf(s.features[i]) === -1) return false;
    if (s.others.length) {
      var hit = false;
      for (i = 0; i < s.others.length; i++) if (item.flags.indexOf(s.others[i]) !== -1) hit = true;
      if (!hit) return false;
    }
    if (!ignoreCity && s.city && item.city !== s.city) return false;
    if (s.query) {
      var hay = (item.name + ' ' + item.city + ' ' + item.suburb + ' ' + item.type + ' ' + TYPE_LABEL[item.type]).toLowerCase();
      if (hay.indexOf(s.query.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function sortList(list) {
    if (state.sort === 'price-asc') list.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === 'price-desc') list.sort(function (a, b) { return b.price - a.price; });
    else if (state.sort === 'beds-desc') list.sort(function (a, b) { return b.beds - a.beds || a.price - b.price; });
    return list;
  }

  /* ---------------- cards ---------------- */
  function specsFor(item) {
    var out = [item.beds + ' bed', item.baths + ' bath', item.park + ' parking'];
    if (item.floor) out.push(item.floor + ' m²');
    if (item.erf) out.push(item.erf + ' m² erf');
    return out;
  }

  function buildCard(item) {
    var card = document.createElement('article');
    card.className = 'property-card';
    card.setAttribute('data-slug', item.slug);
    /* FIX: was data-city, which the page-wide click handler mistook for a city filter button */
    card.setAttribute('data-card-city', item.city);
    card.setAttribute('data-title', item.name + ' — ' + item.beds + ' Bed ' + TYPE_LABEL[item.type]);
    card.setAttribute('data-price', priceLabel(item));
    card.setAttribute('data-specs', item.suburb + ', ' + item.city);

    var badge = item.sold ? '<span class="status-badge is-sold">Sold</span>'
      : item.underOffer ? '<span class="status-badge is-under-offer">Under Offer</span>' : '';
    var specs = specsFor(item).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    var tag = item.cat === 'buy' ? 'For Sale' : item.cat === 'rent' ? 'To Rent' : 'New Development';

    card.innerHTML =
      '<button class="property-media" type="button" aria-label="View photos and details of ' + esc(item.name) + '">' +
        '<img class="property-photo" alt="' +
          esc(item.name + ', ' + TYPE_LABEL[item.type] + ' in ' + item.city) + '" loading="lazy">' +
        '<span class="photo-count">' + photoCount(item) + ' photos</span>' + badge +
      '</button>' +
      '<div class="property-body">' +
        '<p class="property-price">' + esc(priceLabel(item)) + '</p>' +
        '<h3 class="property-name">' + esc(item.name) + '</h3>' +
        '<p class="property-meta">' + esc(item.beds + ' Bed ' + TYPE_LABEL[item.type] + ' · ' + item.suburb + ', ' + item.city) + '</p>' +
        (item.status ? '<p class="property-meta">' + esc(item.status) + '</p>' : '') +
        '<ul class="property-specs">' + specs + '</ul>' +
        '<div class="property-foot"><span class="property-tag">' + tag + '</span>' +
          '<a class="btn-small" href="enquiry.html?property=' + encodeURIComponent(item.name) + '&ref=' + encodeURIComponent(item.id) + '">Enquire</a>' +
        '</div></div>';

    setImage(card.querySelector('.property-photo'), photosFor(item)[0].sources, item.name, item.suburb + ', ' + item.city);
    /* clicking anywhere on the card opens the details; the Enquire button keeps its own link */
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      openDetail(item, card.querySelector('.property-media'));
    });
    return card;
  }

  /* ---------------- rendering ---------------- */
  function renderGrid() {
    if (!els.grid) return;
    var list = sortList(DATA.filter(function (p) { return matches(p); }));

    els.grid.innerHTML = '';
    if (!list.length) {
      els.grid.innerHTML = '<div class="empty-state"><h3>No properties match those filters</h3>' +
        '<p>Try widening the price range, or clear the filters and start again.</p>' +
        '<button type="button" class="btn-search" data-clear-all>Clear all filters</button></div>';
    } else {
      var frag = document.createDocumentFragment();
      list.forEach(function (item) { frag.appendChild(buildCard(item)); });
      els.grid.appendChild(frag);
    }

    var total = DATA.filter(function (p) { return state.category === 'all' || p.cat === state.category; }).length;
    var label = state.category === 'all' ? 'properties' : CATEGORY[state.category].heading;
    if (els.resultsMeta) {
      els.resultsMeta.textContent = list.length === total
        ? 'Showing all ' + total + ' ' + label + '.'
        : 'Showing ' + list.length + ' of ' + total + ' ' + label + '.';
    }
    if (els.resultCount) els.resultCount.textContent = list.length;
    if (els.searchCount) els.searchCount.textContent = list.length;
    if (els.filterBadge) {
      var n = activeFilterCount();
      els.filterBadge.textContent = n;
      els.filterBadge.hidden = n === 0;
    }
  }

  function renderTotals() {
    var totals = { all: DATA.length, buy: 0, rent: 0, development: 0 };
    DATA.forEach(function (p) { totals[p.cat] = (totals[p.cat] || 0) + 1; });
    Object.keys(totals).forEach(function (key) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-count="' + key + '"]'), function (el) {
        el.textContent = totals[key];
      });
    });
  }

  function renderSuggestions() {
    if (!els.suggestRow) return;
    var cities = [];
    DATA.forEach(function (p) { if (cities.indexOf(p.city) === -1) cities.push(p.city); });
    els.suggestRow.innerHTML = cities.map(function (c) {
      return '<button type="button" data-city="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
  }

  /* ---------------- control sync ---------------- */
  function fillPriceSelects() {
    var rent = band() === 'rent';
    var bands = rent ? RENT_PRICES : SALE_PRICES;
    Array.prototype.forEach.call(document.querySelectorAll('[data-price-min], [data-price-max]'), function (select) {
      var isMin = select.hasAttribute('data-price-min');
      var quick = !!select.closest('.quick-select');
      var first = (isMin ? 'Min' : 'Max') + (quick ? ' Price' : '');
      select.disabled = band() === 'all';
      select.title = band() === 'all' ? 'Choose Buy, Rent or Developments to filter by price' : '';
      select.innerHTML = '<option value="">' + first + '</option>' + bands.map(function (v) {
        return '<option value="' + v + '">R' + groupDigits(v) + (rent ? ' p/m' : '') + '</option>';
      }).join('');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-price-unit]'), function (el) {
      el.textContent = rent ? '(R per month)' : '(R)';
    });
    lastBand = band();
  }

  function syncControls() {
    /* FIX: only reset prices when switching between sale and rent, not buy <-> developments */
    if (lastBand !== band()) { state.minPrice = ''; state.maxPrice = ''; fillPriceSelects(); }

    Array.prototype.forEach.call(document.querySelectorAll('[data-category]'), function (el) {
      var on = el.getAttribute('data-category') === state.category;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-filter-input]'), function (el) {
      var key = el.getAttribute('data-filter-input');
      if (el.type === 'checkbox') { el.checked = !!state[key]; }
      else {
        var v = state[key] || '';
        /* a price typed on the index page may not be one of the preset bands */
        if (v && /^(minPrice|maxPrice)$/.test(key) && /^\d+$/.test(v) && !el.querySelector('option[value="' + v + '"]')) {
          el.insertAdjacentHTML('beforeend', '<option value="' + v + '">R' + groupDigits(v) + '</option>');
        }
        el.value = v;
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-feature]'), function (el) {
      el.checked = state.features.indexOf(el.getAttribute('data-feature')) !== -1;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-flag]'), function (el) {
      el.checked = state.others.indexOf(el.getAttribute('data-flag')) !== -1;
    });
    if (els.searchInput && document.activeElement !== els.searchInput) els.searchInput.value = state.query;
    if (els.locationChip) {
      els.locationChip.hidden = !state.city;
      if (els.locationLabel) els.locationLabel.textContent = state.city;
    }
  }

  /* ---------------- interactive map (Leaflet + OpenStreetMap) ---------------- */
  var CITY_COORDS = {
    'Johannesburg': [-26.2041, 28.0473], 'Pretoria': [-25.7479, 28.2293],
    'Cape Town': [-33.9249, 18.4241], 'Durban': [-29.8587, 31.0218]
  };
  var map = null, markerLayer = null;

  /* Leaflet is loaded only when a map is needed, so a slow or blocked
     connection to the Leaflet host can never hold up the rest of the page. */
  function loadLeaflet(done) {
    if (window.L) { done(); return; }
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = done;
    js.onerror = done;
    document.head.appendChild(js);
  }

  function ensureMap() {
    if (map || !els.mapCanvas) return;
    if (!window.L) { els.mapCanvas.textContent = 'The map could not load. Please check your internet connection.'; return; }
    map = L.map(els.mapCanvas, { scrollWheelZoom: false }).setView([-28.5, 25], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
  }

  /* one marker per city, showing how many properties match the other filters */
  function updateMap() {
    if (!map || !els.mapPanel || els.mapPanel.hidden) return;
    markerLayer.clearLayers();
    var counts = {}, points = [];
    DATA.forEach(function (p) { if (matches(p, true)) counts[p.city] = (counts[p.city] || 0) + 1; });
    Object.keys(CITY_COORDS).forEach(function (city) {
      var n = counts[city] || 0;
      if (!n) return;
      var marker = L.marker(CITY_COORDS[city]).addTo(markerLayer);
      marker.bindTooltip(city + ': ' + n + (n === 1 ? ' property' : ' properties'));
      marker.on('click', function () { state.city = city; applyState(); });
      points.push(CITY_COORDS[city]);
    });
    if (state.city && CITY_COORDS[state.city]) map.setView(CITY_COORDS[state.city], 10);
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
    else if (points.length === 1) map.setView(points[0], 10);
  }

  function applyState() { syncControls(); renderGrid(); updateMap(); }

  /* ---------------- drawer ---------------- */
  function openDrawer() {
    if (!els.drawer) return;
    els.drawer.hidden = false;
    document.body.classList.add('no-scroll');
    var close = els.drawer.querySelector('.drawer-close');
    if (close) close.focus();
  }
  function closeDrawer() {
    if (!els.drawer) return;
    els.drawer.hidden = true;
    document.body.classList.remove('no-scroll');
  }

  /* ---------------- property detail view: photos + details card ---------------- */
  var FEATURE_LABEL = {
    petFriendly: 'Pet friendly', garden: 'Garden', pool: 'Pool', flatlet: 'Flatlet',
    securityEstate: 'Security estate', retirement: 'Retirement', repossessed: 'Repossessed',
    onShow: 'On show', auction: 'Auction'
  };

  function cacheDetail() {
    var root = document.querySelector('[data-detail]');
    if (!root) return null;
    function q(name) { return root.querySelector('[data-detail-' + name + ']'); }
    return {
      root: root, image: q('image'), counter: q('counter'), thumbs: q('thumbs'), note: q('note'),
      tag: q('tag'), price: q('price'), title: q('title'), loc: q('loc'), specs: q('specs'),
      list: q('list'), features: q('features'), enquire: q('enquire'), card: root.querySelector('.pd-card'),
      close: root.querySelector('.pd-close')
    };
  }

  function detailRows(item) {
    var rows = [
      ['Property type', TYPE_LABEL[item.type]],
      ['Listing', item.cat === 'buy' ? 'For sale' : item.cat === 'rent' ? 'To rent' : 'New development'],
      ['Status', item.sold ? 'Sold' : item.underOffer ? 'Under offer' : (item.status || 'Available')],
      ['Parking', item.park + ' (' + item.parkType + ')'],
      ['Floor size', item.floor + ' m²'],
      ['Erf size', item.erf ? item.erf + ' m²' : 'Sectional title (no erf)']
    ];
    if (item.cat === 'rent') rows.push(['Deposit (one month)', 'R' + groupDigits(item.price)]);
    if (item.cat === 'buy') rows.push(['Indicative 10% deposit', 'R' + groupDigits(Math.round(item.price * 0.1))]);
    return rows;
  }

  function showPhoto(index) {
    var n = view.photos.length;
    view.index = (index + n) % n;
    var photo = view.photos[view.index];
    setImage(detail.image, photo.sources, view.item.name, photo.label);
    detail.image.alt = view.item.name + ' — ' + photo.label + ' (photo ' + (view.index + 1) + ' of ' + n + ')';
    detail.counter.textContent = (view.index + 1) + ' / ' + n;
    Array.prototype.forEach.call(detail.thumbs.children, function (thumb, i) {
      thumb.classList.toggle('is-active', i === view.index);
      thumb.setAttribute('aria-current', i === view.index ? 'true' : 'false');
    });
    /* with many pictures the thumbnail row scrolls; keep the current one in view */
    var active = detail.thumbs.children[view.index];
    if (active && detail.thumbs.scrollTo) {
      detail.thumbs.scrollTo({ left: active.offsetLeft - (detail.thumbs.clientWidth - active.offsetWidth) / 2, behavior: 'smooth' });
    }
  }

  function openDetail(item, opener) {
    if (!detail) return;
    view.item = item;
    view.photos = photosFor(item);
    lastOpener = opener || null;

    detail.tag.textContent = item.cat === 'buy' ? 'For sale' : item.cat === 'rent' ? 'To rent' : 'New development';
    detail.price.textContent = priceLabel(item);
    detail.title.textContent = item.name;
    detail.loc.textContent = item.suburb + ', ' + item.city;
    detail.specs.innerHTML = [[item.beds, 'Bedroom'], [item.baths, 'Bathroom'], [item.park, 'Parking']].map(function (s) {
      return '<li><strong>' + esc(s[0]) + '</strong><span>' + s[1] + (s[0] === 1 || s[1] === 'Parking' ? '' : 's') + '</span></li>';
    }).join('');
    detail.list.innerHTML = detailRows(item).map(function (r) {
      return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join('');

    var tags = item.feat.concat(item.flags.filter(function (f) { return item.feat.indexOf(f) === -1; }));
    detail.features.innerHTML = tags.length
      ? tags.map(function (t) { return '<li>' + esc(FEATURE_LABEL[t] || t) + '</li>'; }).join('')
      : '<li class="is-empty">No extra features listed</li>';

    detail.enquire.href = 'enquiry.html?property=' + encodeURIComponent(item.name) + '&ref=' + encodeURIComponent(item.id);

    detail.thumbs.innerHTML = '';
    view.photos.forEach(function (photo, i) {
      var thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'pd-thumb';
      thumb.setAttribute('aria-label', 'Show photo ' + (i + 1) + ': ' + photo.label);
      var img = document.createElement('img');
      img.alt = '';
      setImage(img, photo.sources, item.name, photo.label);
      thumb.appendChild(img);
      thumb.addEventListener('click', function () { showPhoto(i); });
      detail.thumbs.appendChild(thumb);
    });
    detail.note.textContent = 'Sample photos are shown for now. To use your own, add images/properties/' + item.slug + '-1.jpg up to -' + photoCount(item) + '.jpg.';

    showPhoto(0);
    detail.root.hidden = false;
    detail.card.scrollTop = 0;
    document.body.classList.add('no-scroll');
    document.addEventListener('keydown', onDetailKey);
    detail.close.focus();
  }

  function closeDetail() {
    if (!detail || detail.root.hidden) return;
    detail.root.hidden = true;
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onDetailKey);
    if (lastOpener) lastOpener.focus();
  }

  function onDetailKey(e) {
    if (e.key === 'Escape') closeDetail();
    if (e.key === 'ArrowRight') showPhoto(view.index + 1);
    if (e.key === 'ArrowLeft') showPhoto(view.index - 1);
  }

  function bindDetail() {
    if (!detail) return;
    Array.prototype.forEach.call(detail.root.querySelectorAll('[data-detail-close]'), function (el) {
      el.addEventListener('click', closeDetail);
    });
    detail.root.querySelector('[data-detail-prev]').addEventListener('click', function () { showPhoto(view.index - 1); });
    detail.root.querySelector('[data-detail-next]').addEventListener('click', function () { showPhoto(view.index + 1); });
  }

  /* ---------------- events ---------------- */
  function clearAll() {
    ['type', 'beds', 'baths', 'park', 'parkType', 'minPrice', 'maxPrice', 'floorMin', 'floorMax', 'erfMin', 'erfMax', 'city', 'query']
      .forEach(function (k) { state[k] = ''; });
    state.features = []; state.others = [];
    state.excludeUnderOffer = false; state.excludeSold = false;
    applyState();
  }

  function bindEvents() {
    document.addEventListener('click', function (e) {
      var categoryBtn = e.target.closest('[data-category]');
      if (categoryBtn) {
        state.category = categoryBtn.getAttribute('data-category');
        applyState();
        scrollToResults();
        return;
      }
      if (e.target.closest('[data-open-filters]')) { openDrawer(); return; }
      if (e.target.closest('[data-close-filters]')) { closeDrawer(); return; }
      if (e.target.closest('[data-apply-filters]')) { closeDrawer(); scrollToResults(); return; }
      if (e.target.closest('[data-clear-all]')) { clearAll(); return; }
      if (e.target.closest('[data-clear-location]')) { state.city = ''; applyState(); return; }

      /* FIX: scoped to the suggestion row only */
      var cityBtn = e.target.closest('[data-suggest-row] [data-city]');
      if (cityBtn) { state.city = cityBtn.getAttribute('data-city'); applyState(); return; }

      if (e.target.closest('[data-toggle-map]') && els.mapPanel) {
        els.mapPanel.hidden = !els.mapPanel.hidden;
        if (!els.mapPanel.hidden) {
          loadLeaflet(function () {
            ensureMap();
            if (map) { map.invalidateSize(); }
            updateMap();
          });
        }
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-filter-input]'), function (el) {
      el.addEventListener('change', function () {
        var key = el.getAttribute('data-filter-input');
        state[key] = el.type === 'checkbox' ? el.checked : el.value;
        applyState();
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-feature]'), function (el) {
      el.addEventListener('change', function () { toggleIn(state.features, el.getAttribute('data-feature'), el.checked); applyState(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-flag]'), function (el) {
      el.addEventListener('change', function () { toggleIn(state.others, el.getAttribute('data-flag'), el.checked); applyState(); });
    });

    if (els.searchForm) {
      els.searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        state.query = (els.searchInput.value || '').trim();
        applyState();
        scrollToResults();
      });
    }
    if (els.searchInput) {
      els.searchInput.addEventListener('input', function () {
        state.query = (els.searchInput.value || '').trim();
        renderGrid();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.drawer && !els.drawer.hidden) closeDrawer();
    });

    bindDetail();
  }

  /* FIX: header "Find a home" link uses #buy; index page can pass ?city=&type=&beds=&q= */
  function readUrl() {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('category') || window.location.hash.replace('#', '');
    if (cat === 'all' || CATEGORY[cat]) state.category = cat;
    ['type', 'beds', 'city'].forEach(function (k) { if (params.get(k)) state[k] = params.get(k); });
    if (params.get('q')) state.query = params.get('q');
    if (params.get('type') && !TYPE_LABEL[params.get('type')]) state.type = '';
    if (state.category !== 'all') {
      if (/^\d+$/.test(params.get('min') || '')) state.minPrice = params.get('min');
      if (/^\d+$/.test(params.get('max') || '')) state.maxPrice = params.get('max');
    }
  }

  function init() {
    els.grid = document.querySelector('[data-grid]');
    els.resultsMeta = document.querySelector('[data-results-meta]');
    els.resultCount = document.querySelector('[data-result-count]');
    els.searchCount = document.querySelector('[data-search-count]');
    els.filterBadge = document.querySelector('[data-filter-badge]');
    els.searchForm = document.querySelector('[data-search-form]');
    els.searchInput = document.querySelector('[data-search-input]');
    els.suggestRow = document.querySelector('[data-suggest-row]');
    els.locationChip = document.querySelector('[data-location-chip]');
    els.locationLabel = document.querySelector('[data-location-label]');
    els.mapPanel = document.querySelector('[data-map-panel]');
    els.mapCanvas = document.querySelector('[data-map-canvas]');
    els.drawer = document.querySelector('[data-drawer]');

    detail = cacheDetail();

    readUrl();
    renderTotals();
    renderSuggestions();
    fillPriceSelects();
    bindEvents();
    applyState();
  }

  /* If anything goes wrong, say so on the page instead of showing an empty list. */
  function showProblem(message) {
    var grid = document.querySelector('[data-grid]');
    if (grid) {
      grid.innerHTML = '<div class="empty-state"><h3>The properties could not be loaded</h3><p>' + esc(message) +
        '</p><p>Press Ctrl+F5 to reload the page. If this message stays, check that js/properties-data.js and js/properties.js are in your js folder.</p></div>';
    }
    var meta = document.querySelector('[data-results-meta]');
    if (meta) meta.textContent = '';
    if (window.console) console.error('UrbanNest properties:', message);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!DATA.length) {
      showProblem('The property list (js/properties-data.js) was not found or is empty.');
      return;
    }
    try { init(); } catch (err) { showProblem('Script error: ' + (err && err.message ? err.message : err)); }
  });
})();