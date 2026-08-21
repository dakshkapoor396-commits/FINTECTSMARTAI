/* FinSmart — a local-first personal finance dashboard */
const $ = id => document.getElementById(id);
const read = (key, fallback) => { try { const item = localStorage.getItem(key); return item === null ? fallback : JSON.parse(item); } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const money = value => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const dateKey = value => new Date(value).toISOString().slice(0, 10);
const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Housing',
  'Utilities',
  'Bills',
  'Healthcare',
  'Education',
  'Insurance',
  'Personal Care',
  'Subscriptions',
  'Travel',
  'Gifts & Donations',
  'Other'
];
const CATEGORY_KEYWORDS = {
  Transport: ['rickshaw', 'auto', 'taxi', 'cab', 'uber', 'ola', 'bus', 'metro', 'train', 'fuel', 'petrol', 'diesel', 'parking', 'toll', 'fare', 'travel'],
  Food: ['burger', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'coffee', 'tea', 'pizza', 'sandwich', 'snack', 'grocery', 'groceries', 'swiggy', 'zomato', 'delivery'],
  Education: ['notebook', 'book', 'stationery', 'school', 'college', 'course', 'tuition', 'class', 'exam', 'fees', 'pen', 'pencil', 'study', 'education'],
  Entertainment: ['movie', 'cinema', 'concert', 'game', 'gaming', 'netflix', 'spotify', 'hotstar', 'theatre', 'show', 'event', 'subscription'],
  Shopping: ['shoes', 'shopping', 'clothes', 'clothing', 'shirt', 'jeans', 'dress', 'bag', 'accessory', 'amazon', 'flipkart', 'mall', 'purchase'],
  Bills: ['recharge', 'bill', 'electricity', 'water', 'internet', 'wifi', 'mobile', 'phone', 'broadband', 'gas', 'rent', 'maintenance', 'dth', 'insurance']
};
function suggestedCategory(name) {
  const text = name.trim().toLowerCase();
  return text ? (Object.entries(CATEGORY_KEYWORDS).find(([, words]) => words.some(word => text.includes(word)))?.[0] || 'Other') : '';
}
const expenses = () => read('expenses', []);
const goals = () => read('goals', []);
const baseAllowance = () => Number(localStorage.getItem('allowance')) || 10000;
const householdMembers = () => read('householdMembers', []);
const allowance = () => baseAllowance() + householdMembers().reduce((sum, member) => sum + Number(member.contribution || 0), 0);
const budgets = () => read('budgets', { Food: 3000, Transport: 1500, Entertainment: 2000, Shopping: 1500 });
const categories = () => [...new Set([...DEFAULT_CATEGORIES, ...read('customCategories', [])])];
const saveExpenses = value => write('expenses', value);
const totalSpent = () => expenses().reduce((sum, item) => sum + Number(item.amount), 0);
const totals = (items = expenses()) => items.reduce((out, item) => ({ ...out, [item.category]: (out[item.category] || 0) + Number(item.amount) }), {});

function initialize() {
  if (!localStorage.getItem('allowance')) localStorage.setItem('allowance', '10000');
  if (!localStorage.getItem('budgets')) write('budgets', { Food: 3000, Transport: 1500, Entertainment: 2000, Shopping: 1500 });
  if (!localStorage.getItem('expenses')) write('expenses', []);
  if (!localStorage.getItem('householdMembers')) write('householdMembers', []);
  if (!localStorage.getItem('goals')) write('goals', [{ id: Date.now(), name: 'Emergency Fund', target: 25000, current: 5000, months: 6 }]);
  rolloverMonth(); document.body.classList.toggle('dark-mode', localStorage.getItem('theme') === 'dark');
  setupThemeSwitch();
  setupSidebarToggle();
  setupDashboardNavigation();
}
function setupSidebarToggle() {
  const button = $('sidebar-toggle');
  if (!button) return;
  const setCollapsed = collapsed => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    button.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  };
  setCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
  button.addEventListener('click', () => setCollapsed(!document.body.classList.contains('sidebar-collapsed')));
}
function setupThemeSwitch() {
  const lightButton = $('light-mode-btn'), darkButton = $('dark-mode-btn');
  if (!lightButton || !darkButton) return;
  const setTheme = theme => {
    const dark = theme === 'dark';
    document.body.classList.toggle('dark-mode', dark);
    localStorage.setItem('theme', theme);
    lightButton.classList.toggle('active', !dark);
    darkButton.classList.toggle('active', dark);
    lightButton.setAttribute('aria-pressed', String(!dark));
    darkButton.setAttribute('aria-pressed', String(dark));
  };
  setTheme(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');
  lightButton.onclick = () => setTheme('light');
  darkButton.onclick = () => setTheme('dark');
}
function setupDashboardNavigation() {
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (!link.textContent.includes('Dashboard')) return;
    let clickTimer;
    link.addEventListener('click', event => {
      event.preventDefault();
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { window.location.href = 'home.html'; }, 250);
    });
    link.addEventListener('dblclick', event => {
      event.preventDefault();
      clearTimeout(clickTimer);
      window.location.href = 'index.html';
    });
  });
}
function rolloverMonth() {
  const previous = localStorage.getItem('activeExpenseMonth'), current = monthKey();
  if (previous && previous !== current) { const old = expenses(), history = read('monthlyHistory', []); history.unshift({ month: previous, spent: totalSpent(), count: old.length, categories: totals(old) }); write('monthlyHistory', history.slice(0, 18)); saveExpenses([]); }
  localStorage.setItem('activeExpenseMonth', current);
  const applied = read('appliedRecurringMonths', {});
  if (!applied[current]) { const next = expenses(); read('recurringExpenses', []).forEach(item => next.push({ id:`rec-${current}-${item.id}`, amount:item.amount, category:item.category, date:new Date(new Date().getFullYear(),new Date().getMonth(),item.day).toISOString(), note:item.name, recurring:true })); saveExpenses(next); applied[current] = true; write('appliedRecurringMonths', applied); }
}
function fillCategories(select, all = false) { if (!select) return; const selected = select.value; select.innerHTML = `${all ? '<option value="">All categories</option>' : ''}${categories().map(name => `<option value="${name}">${name}</option>`).join('')}`; if ([...select.options].some(option => option.value === selected)) select.value = selected; }
function bars(target, values, empty) { if (!target) return; const filtered = values.filter(([,value]) => value > 0), max = Math.max(...filtered.map(([,value]) => value), 1); target.innerHTML = filtered.length ? filtered.map(([name,value]) => `<div class="chart-row"><span>${name}</span><div class="chart-track"><i style="width:${Math.max(4,value/max*100)}%"></i></div><strong>${money(value)}</strong></div>`).join('') : `<p class="empty-state">${empty}</p>`; }

function renderFinancialHealth() {
  const summary=$('dash-allowance'); if(!summary) return;
  const monthlyAllowance=allowance(),spent=totalSpent(),remaining=Math.max(0,monthlyAllowance-spent),limit=budgets(),spentByCategory=totals();
  const categories=Object.entries(limit).filter(([,value])=>Number(value)>0);
  const budgetScore=categories.length?categories.reduce((sum,[name,value])=>sum+Math.max(0,Math.min(1,Number(value)/Math.max(Number(value),spentByCategory[name]||0))),0)/categories.length*25:25;
  const savingsGoals=goals().filter(goal=>Number(goal.target)>0);
  const savingsProgress=savingsGoals.length?savingsGoals.reduce((sum,goal)=>sum+Math.min(1,Number(goal.current)/Number(goal.target)),0)/savingsGoals.length:.4;
  const savingsScore=Math.min(25,2+savingsProgress*25);
  const spendingScore=monthlyAllowance?Math.max(0,25*(1-Math.max(0,spent/monthlyAllowance-.6)/.8)):0;
  const balanceScore=monthlyAllowance?25*remaining/monthlyAllowance:0;
  const score=Math.round(Math.max(0,Math.min(100,budgetScore+savingsScore+spendingScore+balanceScore)));
  const status=score>=80?['good','Good',"You're managing your money well."]:score>=55?['average','Average','Your money is on track, with room to improve.']:['attention','Needs Attention','Review your budget and recent spending.'];
  const icon=status[0]==='good'?'🟢':status[0]==='average'?'🟡':'🔴';
  let card=$('financial-health-card');
  if(!card){document.querySelector('.grid-3').insertAdjacentHTML('afterend','<section id="financial-health-card" class="financial-health card"></section>');card=$('financial-health-card');}
  card.innerHTML=`<div class="health-heading"><div><p class="eyebrow">Financial Health</p><h2>Financial Health Score</h2><p class="health-message">${status[2]}</p></div><span class="health-status ${status[0]}">${icon} ${status[1]}</span></div><div class="health-score-row"><strong>${score}<small>/100</small></strong><div class="health-progress" role="progressbar" aria-label="Financial Health Score" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${score}"><i style="width:${score}%"></i></div></div><p class="health-factors">Budget · Savings · Spending · Remaining balance</p>`;
}

function renderDashboard() {
  if (!$('dash-total-spent')) return;
  const now = new Date(), days = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(), remainingDays = Math.max(1, days-now.getDate()+1), spent = totalSpent(), remain = allowance()-spent;
  $('dash-allowance').textContent = money(allowance()); $('dash-total-spent').textContent = money(spent); $('dash-safe-limit').textContent = money(Math.max(0,remain)/remainingDays); $('dash-days-left').textContent = `${remainingDays} days left · ${money(Math.max(0,remain))} available`;
  renderFinancialHealth();
  const notices = [], spentByCategory = totals(), limits = budgets(), projected = spent / Math.max(now.getDate(),1) * days;
  notices.push(projected > allowance() ? ['danger',`Projected spending is ${money(projected)} — ${money(projected-allowance())} over your allowance.`] : ['success',`On track: projected month-end spending is ${money(projected)}.`]);
  Object.entries(limits).forEach(([name,limit]) => { const used=spentByCategory[name]||0; if(used>=limit) notices.push(['danger',`${name} is over budget by ${money(used-limit)}.`]); else if(used>=limit*.8) notices.push(['warning',`${name} is at ${Math.round(used/limit*100)}% of its limit.`]); });
  const week=expenses().filter(item => Date.now()-new Date(item.date).getTime()<7*86400000).reduce((sum,item)=>sum+Number(item.amount),0); if(week>=allowance()/4*.8) notices.push(['warning',`Weekly spending: ${money(week)} of your ${money(allowance()/4)} guide.`]);
  $('alerts-container').innerHTML=notices.map(([type,text])=>`<div class="alert alert-${type}">● ${text}</div>`).join(''); bars($('category-chart'),Object.entries(spentByCategory),'Add an expense to see category spending.');
  const months=[...read('monthlyHistory',[])].reverse(); months.push({month:monthKey(),spent}); bars($('trend-chart'),months.slice(-6).map(item=>[item.month,item.spent]),'No history yet.');
  $('goal-chart').innerHTML=goals().map(goal=>{const percent=Math.min(100,goal.current/goal.target*100);return `<div class="goal-visual"><span>${goal.name}<b>${Math.round(percent)}%</b></span><div class="progress-track"><i style="width:${percent}%"></i></div></div>`;}).join('') || '<p class="empty-state">Create a goal to track progress.</p>';
  const members=householdMembers(), memberCard=$('household-summary'); if(memberCard) { const contributed=members.reduce((sum,member)=>sum+Number(member.contribution),0); memberCard.innerHTML=members.length?`<div class="household-total"><strong>${money(contributed)}</strong><span>from ${members.length} household member${members.length===1?'':'s'} each month</span></div>${members.map(member=>`<div class="member-share"><span>${member.name}</span><strong>${money(member.contribution)}</strong></div>`).join('')}`:'<p class="empty-state">Add household members in Settings to build a shared budget.</p>'; }
  const daily=expenses().reduce((out,item)=>({...out,[dateKey(item.date)]:(out[dateKey(item.date)]||0)+Number(item.amount)}),{}); let streak=0; for(let i=0;i<30;i++){const date=new Date();date.setDate(date.getDate()-i);if((daily[dateKey(date)]||0)<=allowance()/days)streak++;else break;} $('streak-card').innerHTML=`<strong>${streak} day${streak===1?'':'s'} under budget</strong><span>Stay below ${money(allowance()/days)} a day to keep your streak growing.</span>`;
}

function renderExpenses() {
  const form=$('expense-form'); if(!form) return; ['exp-category','expense-filter-category','recurring-category'].forEach((id,index)=>fillCategories($(id),index===1));
  const expenseName=$('exp-name'), categoryHint=$('category-suggestion');
  const updateSuggestedCategory=()=>{
    const category=suggestedCategory(expenseName.value);
    if(category){$('exp-category').value=category;categoryHint.textContent=`Suggested: ${category}. You can change it if needed.`;}
    else categoryHint.textContent='Enter a name to suggest a category.';
  };
  expenseName.addEventListener('input',updateSuggestedCategory);
  const pageSize=8;
  let currentPage=1;
  const draw=()=>{
    const search=$('expense-search').value.trim().toLowerCase(),category=$('expense-filter-category').value,from=$('expense-filter-from').value,to=$('expense-filter-to').value,min=Number($('expense-filter-min').value)||0,max=Number($('expense-filter-max').value)||Infinity,sort=$('expense-sort').value;
    const list=expenses().filter(item=>(!search||`${item.category} ${item.note||''}`.toLowerCase().includes(search))&&(!category||item.category===category)&&(!from||dateKey(item.date)>=from)&&(!to||dateKey(item.date)<=to)&&item.amount>=min&&item.amount<=max);
    list.sort((a,b)=>sort==='oldest'?new Date(a.date)-new Date(b.date):sort==='highest'?Number(b.amount)-Number(a.amount):sort==='lowest'?Number(a.amount)-Number(b.amount):new Date(b.date)-new Date(a.date));
    const totalPages=Math.max(1,Math.ceil(list.length/pageSize)); currentPage=Math.min(currentPage,totalPages);
    const start=(currentPage-1)*pageSize,visible=list.slice(start,start+pageSize),total=list.reduce((sum,item)=>sum+Number(item.amount),0);
    $('expense-history-summary').textContent=list.length?`${list.length} transaction${list.length===1?'':'s'} · ${money(total)} total`:'No matching transactions';
    $('expense-table-body').innerHTML=visible.length?visible.map((item,index)=>{
      const previous=visible[index-1],showDate=!previous||dateKey(previous.date)!==dateKey(item.date);
      return `<tr><td>${showDate?new Date(item.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):''}</td><td>${item.note||'—'}</td><td>${item.category}</td><td class="amount-cell">${money(item.amount)}</td><td><button class="table-action" data-edit="${item.id}">Edit</button><button class="table-action danger-text" data-delete="${item.id}">Delete</button></td></tr>`;
    }).join(''):expenses().length?'<tr><td colspan="5" class="empty-state">No matching expenses.</td></tr>':'<tr><td colspan="5" class="empty-state">🧾 No expenses yet<br><button type="button" class="btn-primary empty-expense-cta" id="empty-add-expense">Add Expense</button></td></tr>';
    $('expense-pagination').innerHTML=list.length>pageSize?`<button class="table-action" data-page="previous" ${currentPage===1?'disabled':''}>Previous</button><span>Page ${currentPage} of ${totalPages}</span><button class="table-action" data-page="next" ${currentPage===totalPages?'disabled':''}>Next</button>`:'';
    document.querySelectorAll('[data-page]').forEach(button=>button.onclick=()=>{currentPage+=button.dataset.page==='next'?1:-1;draw();});
    const emptyCta=$('empty-add-expense'); if(emptyCta) emptyCta.onclick=()=>{expenseName.focus();form.scrollIntoView({behavior:'smooth',block:'center'});};
    document.querySelectorAll('[data-delete]').forEach(button=>button.onclick=()=>{if(confirm('Delete this transaction?')){saveExpenses(expenses().filter(item=>String(item.id)!==button.dataset.delete));draw();}});
    document.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>{const item=expenses().find(entry=>String(entry.id)===button.dataset.edit),amount=Number(prompt('Enter the corrected amount',item.amount));if(amount>0){saveExpenses(expenses().map(entry=>String(entry.id)===button.dataset.edit?{...entry,amount}:entry));draw();}});
  };
  form.onsubmit=event=>{event.preventDefault();const amount=Number($('exp-amount').value),name=expenseName.value.trim();if(amount>0&&name){saveExpenses([...expenses(),{id:Date.now(),amount,category:$('exp-category').value,note:name,date:new Date().toISOString()}]);form.reset();categoryHint.textContent='Enter a name to suggest a category.';currentPage=1;draw();}};
  ['expense-search','expense-filter-category','expense-filter-from','expense-filter-to','expense-filter-min','expense-filter-max','expense-sort'].forEach(id=>$(id).addEventListener('input',()=>{currentPage=1;draw();}));
  $('clear-expense-filters').onclick=()=>{['expense-search','expense-filter-from','expense-filter-to','expense-filter-min','expense-filter-max'].forEach(id=>$(id).value='');$('expense-filter-category').value='';$('expense-sort').value='newest';currentPage=1;draw();};
  $('add-category-btn').onclick=()=>{const name=prompt('New category name');if(name&&name.trim()&&!categories().some(item=>item.toLowerCase()===name.trim().toLowerCase())){write('customCategories',[...read('customCategories',[]),name.trim()]);['exp-category','expense-filter-category','recurring-category'].forEach((id,index)=>fillCategories($(id),index===1));$('exp-category').value=name.trim();}};
  const recurring=()=>{const list=read('recurringExpenses',[]);$('recurring-list').innerHTML=list.length?list.map(item=>`<div><span><strong>${item.name}</strong> · ${money(item.amount)} <small>${item.category} · ${item.frequency||'Monthly'}</small></span><button class="table-action danger-text" data-recurring="${item.id}">Remove</button></div>`).join(''):'<p class="empty-state">No recurring expenses yet.</p>';document.querySelectorAll('[data-recurring]').forEach(button=>button.onclick=()=>{write('recurringExpenses',list.filter(item=>String(item.id)!==button.dataset.recurring));recurring();});};
  $('recurring-form').onsubmit=event=>{event.preventDefault();const name=$('recurring-name').value.trim(),amount=Number($('recurring-amount').value),day=Number($('recurring-day').value),frequency=$('recurring-frequency').value;if(name&&amount>0&&day>=1&&day<=28){write('recurringExpenses',[...read('recurringExpenses',[]),{id:Date.now(),name,amount,category:$('recurring-category').value,frequency,day}]);event.target.reset();$('recurring-frequency').value='Monthly';recurring();}};const history=read('monthlyHistory',[]);$('monthly-history').innerHTML=history.length?history.map(item=>`<div><strong>${item.month}</strong><span>${money(item.spent)} · ${item.count} transactions</span></div>`).join(''):'<p class="empty-state">Closed months will appear here automatically.</p>';recurring();draw();
}

function renderBudgets(){if(!$('budget-progress-list'))return;const limit=budgets(),spend=totals();$('budget-progress-list').innerHTML=Object.entries(limit).map(([name,max])=>{const used=spend[name]||0,pct=used/max*100,state=pct>=100?'danger':pct>=80?'warning':'';return `<div class="budget-item"><div class="budget-stats"><span>${name}</span><span>${money(used)} / ${money(max)}</span></div><div class="progress-track"><i class="progress-fill ${state}" style="width:${Math.min(100,pct)}%"></i></div></div>`;}).join('');$('recommendations-container').innerHTML=Object.entries(limit).map(([name,max])=>{const used=spend[name]||0;return used>=max*.8?`<div class="alert alert-${used>=max?'danger':'warning'}">${name}: ${used>=max?'over':'near'} its limit — ${money(Math.abs(max-used))} ${used>=max?'over':'remaining'}.</div>`:'';}).join('')||'<div class="alert alert-success">Everything is comfortably within its category limit.</div>';const plans=[['50-30-20','Balanced 50/30/20','50% needs · 30% wants · 20% savings'],['goal-getter','Goal Getter','60% needs · 15% wants · 25% goals'],['pay-yourself-first','Pay Yourself First','Save 20% before spending'],['low-maintenance','Weekly Spending Cap','55% needs · 25% wants · 20% savings']];$('budget-plan-list').innerHTML=plans.map(([id,name,rule])=>`<article class="plan-card ${localStorage.getItem('selectedBudgetPlan')===id?'selected':''}"><span class="plan-rule">${rule}</span><h3>${name}</h3><p>Apply this plan to calculate your category limits and monthly savings target.</p><button class="btn-plan" data-plan="${id}">${localStorage.getItem('selectedBudgetPlan')===id?'Applied':'Apply plan'}</button></article>`).join('');document.querySelectorAll('[data-plan]').forEach(button=>button.onclick=()=>applyPlan(button.dataset.plan));}
function applyPlan(id){const config={'50-30-20':[.5,.3,.2],'goal-getter':[.6,.15,.25],'pay-yourself-first':[.5,.3,.2],'low-maintenance':[.55,.25,.2]}[id];if(!config)return;const[needs,wants,savings]=config,total=allowance();write('budgets',{...budgets(),Food:Math.round(total*needs*.6),Transport:Math.round(total*needs*.4),Entertainment:Math.round(total*wants*.45),Shopping:Math.round(total*wants*.55)});localStorage.setItem('savingsTarget',String(Math.round(total*savings)));localStorage.setItem('selectedBudgetPlan',id);renderBudgets();alert(`${id.replaceAll('-',' ')} applied. Savings target: ${money(total*savings)}.`);}

function renderGoals(){const form=$('goal-form');if(!form)return;const render=()=>{$('goals-list').innerHTML=goals().map(goal=>{const pct=Math.min(100,goal.current/goal.target*100),remaining=Math.max(0,goal.target-goal.current),needed=remaining/goal.months;return `<article class="goal-card"><div class="goal-header"><h4>${goal.name}</h4><span class="goal-percent">${Math.round(pct)}% complete</span></div><div class="goal-amount"><strong>${money(goal.current)}</strong><span>saved of ${money(goal.target)}</span></div><div class="progress-track"><i class="progress-fill" style="width:${pct}%"></i></div><div class="goal-details"><div><span>Remaining</span><strong>${money(remaining)}</strong></div><div><span>Monthly target</span><strong>${money(Math.ceil(needed))}</strong></div><div><span>Timeline</span><strong>${goal.months} month${goal.months===1?'':'s'}</strong></div></div><div class="goal-actions"><input type="number" min="1" placeholder="Add savings" data-goal-input="${goal.id}"><button class="btn-small btn-accept" data-goal-add="${goal.id}">Add</button><button class="btn-small btn-reject" data-goal-delete="${goal.id}">Delete</button></div></article>`;}).join('')||'<div class="card empty-state">Create a savings goal to start tracking progress.</div>';document.querySelectorAll('[data-goal-add]').forEach(button=>button.onclick=()=>transfer(Number(button.dataset.goalAdd),Number(document.querySelector(`[data-goal-input="${button.dataset.goalAdd}"]`).value),render));document.querySelectorAll('[data-goal-delete]').forEach(button=>button.onclick=()=>{write('goals',goals().filter(goal=>goal.id!==Number(button.dataset.goalDelete)));render();});};form.onsubmit=event=>{event.preventDefault();const name=$('goal-name').value.trim(),target=Number($('goal-target').value),months=Number($('goal-months').value);if(name&&target>0&&months>0){write('goals',[...goals(),{id:Date.now(),name,target,current:0,months}]);form.reset();render();}};render();const select=$('transfer-goal');select.innerHTML=goals().map(goal=>`<option value="${goal.id}">${goal.name}</option>`).join('')||'<option value="">Create a goal first</option>';$('transfer-savings-btn').onclick=()=>transfer(Number(select.value),Number($('transfer-amount').value),()=>location.reload());}
function transfer(id,amount,done){if(!(amount>0)||!id)return;if(totalSpent()+amount>allowance())return alert('That transfer exceeds your available monthly balance.');write('goals',goals().map(goal=>goal.id===id?{...goal,current:goal.current+amount}:goal));saveExpenses([...expenses(),{id:Date.now(),amount,category:'Savings',note:'Savings transfer',date:new Date().toISOString()}]);done();}

function renderSettings(){if(!$('save-allowance-btn'))return;$('setting-allowance').value=allowance();const limit=budgets();['food','transport','entertainment','shopping'].forEach(name=>$(`setting-budget-${name}`).value=limit[name[0].toUpperCase()+name.slice(1)]||0);$('save-allowance-btn').onclick=()=>{if(Number($('setting-allowance').value)>0)localStorage.setItem('allowance',$('setting-allowance').value);};$('settings-budgets-form').onsubmit=event=>{event.preventDefault();write('budgets',{Food:Number($('setting-budget-food').value),Transport:Number($('setting-budget-transport').value),Entertainment:Number($('setting-budget-entertainment').value),Shopping:Number($('setting-budget-shopping').value)});alert('Budget limits saved.');};$('reset-expenses-btn').onclick=()=>{if(confirm('Archive this month and clear its expenses?')){write('monthlyHistory',[{month:monthKey(),spent:totalSpent(),count:expenses().length,categories:totals()},...read('monthlyHistory',[])].slice(0,18));saveExpenses([]);alert('Month archived and expenses cleared.');}};$('export-data-btn').onclick=exportCSV;$('export-backup-btn').onclick=exportBackup;$('import-data-input').onchange=importBackup;}
function renderHouseholdSettings(){const form=$('household-member-form');if(!form)return;$('setting-allowance').value=baseAllowance();const draw=()=>{const members=householdMembers();$('household-member-list').innerHTML=members.length?members.map(member=>`<div><span><strong>${member.name}</strong><small>${money(member.contribution)} monthly contribution</small></span><button class="table-action danger-text" data-member="${member.id}">Remove</button></div>`).join(''):'<p class="empty-state">No household members added yet.</p>';document.querySelectorAll('[data-member]').forEach(button=>button.onclick=()=>{write('householdMembers',householdMembers().filter(member=>String(member.id)!==button.dataset.member));draw();});};form.onsubmit=event=>{event.preventDefault();const name=$('household-member-name').value.trim(),contribution=Number($('household-member-contribution').value);if(name&&contribution>0){write('householdMembers',[...householdMembers(),{id:Date.now(),name,contribution}]);form.reset();draw();}};draw();}
function download(blob,name){const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),100);}
function exportCSV(){const rows=[['Date','Category','Amount','Note'],...expenses().map(item=>[dateKey(item.date),item.category,item.amount,item.note||''])];download(new Blob([rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\n')],{type:'text/csv'}),`finsmart-expenses-${monthKey()}.csv`);}
function exportBackup(){const data={};['allowance','budgets','expenses','goals','customCategories','recurringExpenses','monthlyHistory','appliedRecurringMonths','selectedBudgetPlan','savingsTarget','theme','householdMembers'].forEach(key=>data[key]=localStorage.getItem(key));download(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),`finsmart-backup-${monthKey()}.json`);}
function importBackup(event){const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!data||typeof data!=='object')throw Error();Object.entries(data).forEach(([key,value])=>{if(value!==null)localStorage.setItem(key,value);});location.reload();}catch{alert('Please choose a valid FinSmart JSON backup.');}};reader.readAsText(file);}

initialize();renderDashboard();renderExpenses();renderBudgets();renderGoals();renderSettings();renderHouseholdSettings();
window.addEventListener('storage', event=>{if(['allowance','budgets','expenses','goals','householdMembers'].includes(event.key))renderDashboard();});


