const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

let calState = {
  checkinDate:  null,
  checkoutDate: null,
  month: new Date().getMonth(),
  year:  new Date().getFullYear()
};

function openCalendar(type) {
  const id    = type === 'checkin' ? 'calCheckin' : 'calCheckout';
  const popup = document.getElementById(id);
  document.querySelectorAll('.calendar-popup').forEach(p => {
    if (p.id !== id) p.classList.remove('show');
  });
  if (popup.classList.contains('show')) { popup.classList.remove('show'); return; }
  calState.month = new Date().getMonth();
  calState.year  = new Date().getFullYear();
  renderCalendar(type);
  popup.classList.add('show');
}

function renderCalendar(type) {
  const id          = type === 'checkin' ? 'calCheckin' : 'calCheckout';
  const popup       = document.getElementById(id);
  const today       = new Date(); today.setHours(0,0,0,0);
  const firstDay    = new Date(calState.year, calState.month, 1).getDay();
  const daysInMonth = new Date(calState.year, calState.month + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const date    = new Date(calState.year, calState.month, d);
    const dateStr = fmtDate(date);
    let cls = 'cal-day'; let click = true;
    if (date < today) { cls += ' disabled'; click = false; }
    if (type === 'checkout' && calState.checkinDate &&
        date <= new Date(calState.checkinDate + 'T00:00:00')) {
      cls += ' disabled'; click = false;
    }
    if (dateStr === fmtDate(today)) cls += ' today';
    if (dateStr === calState.checkinDate || dateStr === calState.checkoutDate) cls += ' selected';
    const fn = click ? `onclick="selectDate('${dateStr}','${type}')"` : '';
    html += `<div class="${cls}" ${fn}>${d}</div>`;
  }

  popup.innerHTML = `
    <div class="cal-header">
      <button onclick="changeMonth(-1,'${type}')">‹</button>
      <span>${MONTH_NAMES[calState.month]} ${calState.year}</span>
      <button onclick="changeMonth(1,'${type}')">›</button>
    </div>
    <div class="cal-days-header">
      <span>Su</span><span>Mo</span><span>Tu</span>
      <span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
    </div>
    <div class="cal-days">${html}</div>`;
}

function changeMonth(dir, type) {
  calState.month += dir;
  if (calState.month > 11) { calState.month = 0; calState.year++; }
  if (calState.month < 0)  { calState.month = 11; calState.year--; }
  renderCalendar(type);
}

function selectDate(dateStr, type) {
  if (type === 'checkin') {
    calState.checkinDate = dateStr;
    document.getElementById('checkinValue').value = dateStr;
    document.getElementById('checkinDisplay').textContent = fmtDisplay(dateStr);
    document.getElementById('checkinDisplay').className = 'selected-date';
    document.getElementById('calCheckin').classList.remove('show');
    if (!calState.checkoutDate) {
      calState.month = new Date(dateStr).getMonth();
      calState.year  = new Date(dateStr).getFullYear();
      renderCalendar('checkout');
      document.getElementById('calCheckout').classList.add('show');
    }
  } else {
    calState.checkoutDate = dateStr;
    document.getElementById('checkoutValue').value = dateStr;
    document.getElementById('checkoutDisplay').textContent = fmtDisplay(dateStr);
    document.getElementById('checkoutDisplay').className = 'selected-date';
    document.getElementById('calCheckout').classList.remove('show');
  }
}

function resetCalendar() {
  calState.checkinDate  = null;
  calState.checkoutDate = null;
  const ci = document.getElementById('checkinDisplay');
  const co = document.getElementById('checkoutDisplay');
  if (ci) { ci.textContent = 'Select date'; ci.className = 'placeholder'; }
  if (co) { co.textContent = 'Select date'; co.className = 'placeholder'; }
  const cv = document.getElementById('checkinValue');
  const ov = document.getElementById('checkoutValue');
  if (cv) cv.value = '';
  if (ov) ov.value = '';
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.date-picker-wrapper')) {
    document.querySelectorAll('.calendar-popup').forEach(p => p.classList.remove('show'));
  }
});