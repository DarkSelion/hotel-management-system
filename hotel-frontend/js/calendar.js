const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

let calState = {
  checkinDate:  null,
  checkoutDate: null,
  activeType:   null,
  month:        new Date().getMonth(),
  year:         new Date().getFullYear()
};

function openCalendar(type) {
  const id    = type === 'checkin' ? 'calCheckin' : 'calCheckout';
  const popup = document.getElementById(id);

  // Close other calendar first
  document.querySelectorAll('.calendar-popup').forEach(p => {
    if (p.id !== id) p.classList.remove('show');
  });

  // Toggle current
  if (popup.classList.contains('show')) {
    popup.classList.remove('show');
    calState.activeType = null;
    return;
  }

  // Set active type and reset month/year to today
  calState.activeType = type;
  calState.month      = new Date().getMonth();
  calState.year       = new Date().getFullYear();

  // If checkout open auto start from checkin month
  if (type === 'checkout' && calState.checkinDate) {
    const d         = new Date(calState.checkinDate + 'T00:00:00');
    calState.month  = d.getMonth();
    calState.year   = d.getFullYear();
  }

  renderCalendar(type);
  popup.classList.add('show');
}

function renderCalendar(type) {
  const id          = type === 'checkin' ? 'calCheckin' : 'calCheckout';
  const popup       = document.getElementById(id);
  if (!popup) return;

  const today       = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay    = new Date(calState.year, calState.month, 1).getDay();
  const daysInMonth = new Date(calState.year, calState.month + 1, 0).getDate();

  let html = '';

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-day empty"></div>';
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const date    = new Date(calState.year, calState.month, d);
    const dateStr = fmtDate(date);
    let cls       = 'cal-day';
    let click     = true;

    // Disable past dates
    if (date < today) {
      cls  += ' disabled';
      click = false;
    }

    // Disable checkout dates before or equal to checkin
    if (type === 'checkout' && calState.checkinDate) {
      const cin = new Date(calState.checkinDate + 'T00:00:00');
      if (date <= cin) {
        cls  += ' disabled';
        click = false;
      }
    }

    // Today highlight
    if (dateStr === fmtDate(today)) cls += ' today';

    // Selected highlight
    if (dateStr === calState.checkinDate)  cls += ' selected';
    if (dateStr === calState.checkoutDate) cls += ' selected';

    const fn = click
      ? `onclick="selectDate('${dateStr}','${type}')"`
      : '';

    html += `<div class="${cls}" ${fn}>${d}</div>`;
  }

  // FIXED: Added 'event' to the changeMonth calls
  popup.innerHTML = `
    <div class="cal-header">
      <button type="button" onclick="changeMonth(event, -1,'${type}')">‹</button>
      <span>${MONTH_NAMES[calState.month]} ${calState.year}</span>
      <button type="button" onclick="changeMonth(event, 1,'${type}')">›</button>
    </div>
    <div class="cal-days-header">
      <span>Su</span><span>Mo</span><span>Tu</span>
      <span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
    </div>
    <div class="cal-days">${html}</div>`;
}

// FIXED: Added e.stopPropagation()
function changeMonth(e, dir, type) {
  if (e) e.stopPropagation(); 

  calState.month += dir;

  // Handle year overflow
  if (calState.month > 11) {
    calState.month = 0;
    calState.year++;
  }
  if (calState.month < 0) {
    calState.month = 11;
    calState.year--;
  }

  // Re-render without closing
  renderCalendar(type);
}

function selectDate(dateStr, type) {
  if (type === 'checkin') {
    calState.checkinDate = dateStr;

    const checkinInput = document.getElementById('checkinValue');
    const checkinDisp  = document.getElementById('checkinDisplay');
    if (checkinInput) checkinInput.value         = dateStr;
    if (checkinDisp)  checkinDisp.textContent    = fmtDisplay(dateStr);
    if (checkinDisp)  checkinDisp.className      = 'selected-date';

    // Close checkin calendar
    const calCheckin = document.getElementById('calCheckin');
    if (calCheckin) calCheckin.classList.remove('show');

    // Auto open checkout if not selected
    if (!calState.checkoutDate) {
      const d        = new Date(dateStr + 'T00:00:00');
      calState.month = d.getMonth();
      calState.year  = d.getFullYear();
      calState.activeType = 'checkout';
      renderCalendar('checkout');
      const calCheckout = document.getElementById('calCheckout');
      if (calCheckout) calCheckout.classList.add('show');
    }

  } else {
    calState.checkoutDate = dateStr;

    const checkoutInput = document.getElementById('checkoutValue');
    const checkoutDisp  = document.getElementById('checkoutDisplay');
    if (checkoutInput) checkoutInput.value      = dateStr;
    if (checkoutDisp)  checkoutDisp.textContent = fmtDisplay(dateStr);
    if (checkoutDisp)  checkoutDisp.className   = 'selected-date';

    // Close checkout calendar
    const calCheckout = document.getElementById('calCheckout');
    if (calCheckout) calCheckout.classList.remove('show');
  }
}

function resetCalendar() {
  calState.checkinDate  = null;
  calState.checkoutDate = null;
  calState.activeType   = null;
  calState.month        = new Date().getMonth();
  calState.year         = new Date().getFullYear();

  const ci = document.getElementById('checkinDisplay');
  const co = document.getElementById('checkoutDisplay');
  const cv = document.getElementById('checkinValue');
  const ov = document.getElementById('checkoutValue');

  if (ci) { ci.textContent = 'Select date'; ci.className = 'placeholder'; }
  if (co) { co.textContent = 'Select date'; co.className = 'placeholder'; }
  if (cv) cv.value = '';
  if (ov) ov.value = '';
}

// Note: fmtDate() and fmtDisplay() are defined in config.js which is loaded before this file.

// Close calendar when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.date-picker-wrapper')) {
    document.querySelectorAll('.calendar-popup').forEach(p => {
      p.classList.remove('show');
    });
    calState.activeType = null;
  }
});