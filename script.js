/* ICTU LEARN - Pure HTML/CSS/JavaScript, no external dependencies.
   Source: CHỦ NGHĨA XÃ HỘI KHOA HỌC(2).docx - 6 lessons, 251 questions.
   Correct answers are copied from highlights or explicit answer labels in the document.
*/
(() => {
  'use strict';
  if (!window.ICTUAuth?.getSession()) {
    window.location.replace('login.html');
    return;
  }
  const session = window.ICTUAuth.getSession();
  const bank = window.QUESTION_BANK;
  if (!bank || !Array.isArray(bank.lessons)) {
    document.getElementById('app').textContent = 'Không tìm thấy questions.js. Hãy mở index.html trong thư mục đầy đủ.';
    return;
  }
  const STORE = 'ictu_cnxhkh_lms_v1';
  const TYPE_LABEL = {single:'Chọn 1 đáp án',multi:'Chọn nhiều đáp án',tf:'Đúng / Sai',match:'Kéo thả ghép nối',categorize:'Kéo thả phân loại'};
  const LESSON_ICONS = ['◈','⌁','⚖','✥','◎','⌂'];
  const el = (id) => document.getElementById(id);
  const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format = (s) => escapeHTML(s).replace(/_{3,}/g,'<span class="blank">________</span>');
  const asNumber = x => Number.parseInt(x,10);
  const slug = s => encodeURIComponent(String(s));
  const unslug = s => decodeURIComponent(s || '');
  const normalize = s => String(s || '').normalize('NFC').trim().replace(/[.\s]+$/,'').toLocaleLowerCase('vi-VN');
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const allQuestions = bank.lessons.flatMap(l => l.questions);
  const totalQuestions = allQuestions.length;
  const aggregateLesson = {
    id: 0,
    title: 'Bài tổng hợp · Toàn bộ câu hỏi',
    questions: allQuestions.map(q => ({...clone(q), id:`all-${q.id}`, lesson:0}))
  };
  const mapQ = Object.fromEntries(allQuestions.map(q => [q.id,q]));
  const defaultSaved = () => ({answers:{},checked:{},submissions:{},modes:{},starts:{},orders:{},optionOrders:{}});
  let saved;
  try { const parsed = JSON.parse(localStorage.getItem(STORE)||'null'); saved={...defaultSaved(),...parsed}; }
  catch { saved=defaultSaved(); }
  for (const k of Object.keys(defaultSaved())) if (!saved[k] || typeof saved[k]!=='object') saved[k]={};
  let ui = {page:'dashboard',lesson:1,index:0,selectedMatch:null,selectedCategory:null,resultFilter:'all'};
  let toastTimer;
  function setupAccountBar() {
    const roleLabel = session.role === 'admin' ? 'Quản trị viên' : 'Học viên';
    const initials = session.name.split(/\s+/).map(part => part[0]).join('').slice(-2).toUpperCase();
    const name = document.getElementById('profile-name');
    const role = document.getElementById('profile-role');
    const avatar = document.getElementById('profile-avatar');
    const adminLink = document.getElementById('admin-link');
    const logout = document.getElementById('logout');
    if (name) name.textContent = session.name;
    if (role) role.textContent = roleLabel;
    if (avatar) avatar.textContent = initials || 'SV';
    if (adminLink) {
      adminLink.hidden = session.role !== 'admin';
      adminLink.style.display = session.role === 'admin' ? '' : 'none';
    }
    if (logout) logout.addEventListener('click', window.ICTUAuth.signOut);
  }
  const shuffle = items => {
    const result = [...items];
    for(let i=result.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  };
  function ensureExamOrder(l){
    const ids=l.questions.map(q=>q.id),savedOrder=saved.orders[l.id];
    if(!Array.isArray(savedOrder)||savedOrder.length!==ids.length||new Set(savedOrder).size!==ids.length||savedOrder.some(id=>!ids.includes(id))){
      saved.orders[l.id]=shuffle(ids);
    }
    for(const q of l.questions){
      const keys=q.options?.map(option=>option.key);
      const choices=q.choices?[...new Set(q.choices)]:null;
      const values=keys||choices;
      if(!values)continue;
      const optionOrder=saved.optionOrders[q.id];
      if(!Array.isArray(optionOrder)||optionOrder.length!==values.length||new Set(optionOrder).size!==values.length||optionOrder.some(value=>!values.includes(value))){
        saved.optionOrders[q.id]=shuffle(values);
      }
    }
  }
  function questionsForLesson(l){
    if(mode(l.id)!=='exam')return l.questions;
    ensureExamOrder(l);
    const byId=Object.fromEntries(l.questions.map(q=>[q.id,q]));
    return saved.orders[l.id].map(id=>{
      const q=byId[id],optionOrder=saved.optionOrders[q.id];
      if(!optionOrder)return q;
      if(q.options){
        const options=optionOrder.map(key=>q.options.find(option=>option.key===key)).filter(Boolean);
        return {...q,options};
      }
      if(q.choices){
        const choices=optionOrder.filter(choice=>q.choices.includes(choice));
        return {...q,choices};
      }
      return q;
    });
  }
  const lessonById = id => {
    if(Number(id)===aggregateLesson.id){
      return {...aggregateLesson,questions:questionsForLesson(aggregateLesson)};
    }
    const lesson=bank.lessons.find(l => l.id === Number(id));
    return lesson?{...lesson,questions:questionsForLesson(lesson)}:undefined;
  };
  const currentLesson = () => lessonById(ui.lesson);
  const currentQuestion = () => currentLesson()?.questions[ui.index];
  const mode = id => id===aggregateLesson.id?'exam':saved.modes[id]||'practice';
  const submitted = id => !!saved.submissions[id];
  const readOnly = () => submitted(ui.lesson);
  function store(){try{localStorage.setItem(STORE,JSON.stringify(saved));}catch(e){console.warn('Local storage disabled:',e);}}
  function emptyAnswer(q){if(q.type==='single'||q.type==='multi')return [];if(q.type==='tf'||q.type==='match')return [];return {};}
  function answer(q){return saved.answers[q.id] ?? emptyAnswer(q);}
  function answered(q) {
    const a=answer(q);
    if(q.type==='single')return Array.isArray(a)&&a.length===1;
    if(q.type==='multi')return Array.isArray(a)&&new Set(a).size===q.expected;
    if(q.type==='tf')return Array.isArray(a)&&q.statements.every((_,i)=>a[i]==='Đúng'||a[i]==='Sai');
    if(q.type==='match')return Array.isArray(a)&&q.pairs.every((_,i)=>!!a[i]);
    if(q.type==='categorize')return categoryItems(q).every(item=>Number.isInteger(a[item.index]));
    return false;
  }
  function correct(q){
    const a=answer(q);
    if(!answered(q))return false;
    if(q.type==='single'||q.type==='multi'){
      const selected=new Set(a),expected=new Set(q.answers);
      return selected.size===expected.size&&[...expected].every(key=>selected.has(key));
    }
    if(q.type==='tf')return q.statements.every((s,i)=>s.answer===a[i]);
    if(q.type==='match')return q.pairs.every((s,i)=>normalize(s.answer)===normalize(a[i]));
    if(q.type==='categorize')return categoryItems(q).every(item=>Number(a[item.index])===item.group);
    return false;
  }
  function categoryItems(q){return q.groups.flatMap((g,group)=>g.items.map((text,i)=>({index:q.groups.slice(0,group).reduce((n,a)=>n+a.items.length,0)+i,text,group})));}
  function lessonStats(l){
    let count=0,checked=0,score=0;
    for(const q of l.questions){if(answered(q))count++;if(saved.checked[q.id]){checked++;if(correct(q))score++;}}
    const result=saved.submissions[l.id];
    return {count,checked,score,total:l.questions.length,percent:Math.round(count*100/l.questions.length),result};
  }
  function elapsed(ms){let seconds=Math.max(0,Math.floor(ms/1000));let min=Math.floor(seconds/60);return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
  function toast(message){const x=el('toast');x.textContent=message;x.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.classList.remove('show'),2800);}
  function headerClock(){const d=new Date();el('live-clock').textContent=d.toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});}
  function updateSidebar(){
    el('lesson-nav').innerHTML=bank.lessons.map(l=>{
      const st=lessonStats(l),active=ui.lesson===l.id&&ui.page!=='dashboard';
      return `<button class="side-link ${active?'active':''}" data-action="open-lesson" data-lesson="${l.id}" title="${escapeHTML(l.title)}"><span class="side-ico" aria-hidden="true">${String(l.id).padStart(2,'0')}</span> Bài ${l.id}<span class="lesson-pill">${st.result?'✓':st.count+'/'+st.total}</span></button>`;
    }).join('');
    const isHome=ui.page==='dashboard';
    document.querySelectorAll('[data-nav="home"]').forEach(n=>n.classList.toggle('active',isHome));
    document.querySelectorAll('[data-nav="lessons"]').forEach(n=>n.classList.toggle('active',false));
    const crumb=el('breadcrumb');
    crumb.innerHTML=isHome?'Trang chủ <span>/</span> Tổng quan':`Khóa học <span>/</span> Bài ${ui.lesson} <span>/</span> ${ui.page==='results'?'Kết quả':'Bài kiểm tra'}`;
  }
  function render(){
    updateSidebar();
    if(ui.page==='dashboard')el('app').innerHTML=dashboard();
    else if(ui.page==='quiz')el('app').innerHTML=quiz();
    else if(ui.page==='results')el('app').innerHTML=results();
    else ui.page='dashboard',el('app').innerHTML=dashboard();
    headerClock();
  }
  function dashboard(){
    const stats=bank.lessons.map(lessonStats);
    const answeredTotal=stats.reduce((a,s)=>a+s.count,0);
    const finished=stats.filter(s=>s.result).length;
    const correctTotal=allQuestions.filter(q=>saved.submissions[q.lesson] && correct(q)).length;
    const completedAttempts=allQuestions.filter(q=>saved.submissions[q.lesson]).length;
    return `
      <section class="page-heading"><div><div class="eyebrow">TRANG TỔNG QUAN</div><h1>Xin chào, học viên 👋</h1><p class="subtle">Tiếp tục ôn tập và theo dõi tiến độ của bạn hôm nay.</p></div><button class="btn btn-light" data-action="reset-all">↺ Đặt lại toàn bộ</button></section>
      <section class="hero"><div class="hero-text"><div class="hero-kicker">KHÓA HỌC ĐANG MỞ</div><h1>Chủ nghĩa xã hội khoa học</h1><p>Ngân hàng câu hỏi trắc nghiệm từ tài liệu ôn tập. Luyện kỹ năng, tự kiểm tra và theo dõi kết quả học tập theo từng bài.</p><div class="hero-meta"><span>◧ 6 bài học</span><span>☷ ${totalQuestions} câu hỏi</span><span>◇ 5 dạng tương tác</span></div></div><div class="hero-watermark" aria-hidden="true">✦</div></section>
      <section class="stats-grid">
        ${statCard('📘','Bài học',`${bank.lessons.length}`,'blue-icon')}
        ${statCard('☰','Câu đã trả lời',`${answeredTotal} / ${totalQuestions}`,'purple-icon')}
        ${statCard('✓','Bài đã hoàn thành',`${finished} / ${bank.lessons.length}`,'mint-icon')}
        ${statCard('◎','Độ chính xác',completedAttempts?`${Math.round(correctTotal*100/completedAttempts)}%`:'—','amber-icon')}
      </section>
      <section class="section-heading"><div><div class="eyebrow">LỘ TRÌNH HỌC TẬP</div><h2>Danh sách 6 bài học</h2></div><span class="subtle" style="font-size:12px">Chọn một bài để bắt đầu</span></section>
      <section class="lesson-grid">${bank.lessons.map(l=>lessonCard(l)).join('')}</section>
      <p class="notice">💡 <strong>Mẹo:</strong> Chế độ <strong>Luyện tập</strong> cho phép kiểm tra từng câu; chế độ <strong>Thi thử</strong> chỉ công bố đáp án sau khi nộp toàn bài. Tiến độ được lưu ngay trên thiết bị này.</p>`;
  }
  function statCard(icon,title,val,color){return `<div class="stat-card"><div class="stat-icon ${color}" aria-hidden="true">${icon}</div><div class="stat-info"><small>${title}</small><strong>${val}</strong></div></div>`;}
  function lessonCard(l){
    const s=lessonStats(l),label=s.result?'Xem kết quả':s.count>0?'Tiếp tục học':'Bắt đầu học';
    return `<article class="lesson-card"><div class="lesson-card-top"><span class="chapter">BÀI ${String(l.id).padStart(2,'0')}</span><span class="complete-pill">${s.result?'✓ Đã hoàn thành':`${s.percent}% hoàn thành`}</span></div><h3>${escapeHTML(l.title)}</h3><p class="description">${s.total} câu · Chọn đáp án, đúng/sai, kéo thả</p><div class="progress-label"><span>Tiến độ học tập</span><strong>${s.count}/${s.total}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${s.percent}%"></div></div><div class="lesson-bottom"><span class="count">${s.result?`Điểm: ${s.result.score}/${s.total}`:'Sẵn sàng học'}</span><button class="btn btn-primary btn-xs" data-action="open-lesson" data-lesson="${l.id}">${label} →</button></div></article>`;
  }
  function quiz(){
    const l=currentLesson(),q=currentQuestion(),s=lessonStats(l),i=ui.index, exam=mode(l.id)==='exam';
    if(!q)return '<p>Không có câu hỏi.</p>';
    const lessonLabel=l.id===aggregateLesson.id?'TỔNG HỢP':`BÀI ${String(l.id).padStart(2,'0')}`;
    return `<section class="quiz-head"><div><div class="quiz-topline"><span class="tag">${lessonLabel}</span><span class="quiet">${l.questions.length} câu hỏi · ${exam?'Thi thử':'Luyện tập'}</span></div><h1>${escapeHTML(l.title)}</h1></div><button class="btn btn-light" data-action="home">← Tất cả bài học</button></section>
    <section class="quiz-topline" style="justify-content:space-between;margin-bottom:14px"><div class="mode-switch" aria-label="Chế độ học"><button class="${!exam?'selected':''}" data-action="mode" data-mode="practice">☼ Luyện tập</button><button class="${exam?'selected':''}" data-action="mode" data-mode="exam">◷ Thi thử</button></div><span class="quiet" style="color:#728199;font-size:12px">◷ <span class="elapsed" data-start="${saved.starts[l.id]||Date.now()}">${elapsed(Date.now()-(saved.starts[l.id]||Date.now()))}</span> &nbsp; · &nbsp; Đã trả lời ${s.count}/${s.total}</span></section>
    <section class="quiz-progress"><div class="progress-track"><div class="progress-fill" style="width:${s.percent}%"></div></div></section>
    <div class="quiz-layout"><section class="content-card question-panel">
      <div class="q-head"><div class="q-number"><div class="q-index">${i+1}</div><div><span>Câu ${i+1} trên ${l.questions.length}</span><strong>Câu ${q.number} trong tài liệu</strong></div></div><span class="type-badge">${TYPE_LABEL[q.type]}</span></div>
      <div class="q-prompt">${format(q.prompt)}</div>${renderQuestion(q)}${renderFeedback(q)}
      <div class="question-actions"><div class="action-cluster"><button class="btn btn-light" data-action="previous" ${i===0?'disabled':''}>← Câu trước</button><button class="btn btn-light" data-action="next" ${i===l.questions.length-1?'disabled':''}>Câu sau →</button></div><div class="action-cluster">${!exam&&!readOnly()?`<button class="btn btn-ghost" data-action="check" ${!answered(q)?'disabled title="Hãy trả lời đầy đủ"':''}>✓ Kiểm tra câu này</button>`:''}${i===l.questions.length-1?`<button class="btn btn-primary" data-action="submit-lesson">${readOnly()?'Xem kết quả':'Nộp bài →'}</button>`:''}</div></div>
    </section><aside class="content-card quiz-side"><div class="side-section-title">Danh sách câu hỏi</div><div class="side-section-sub">Bấm số câu để chuyển nhanh</div><div class="palette">${l.questions.map((x,k)=>{
      const reviewed=saved.checked[x.id]||readOnly(),st=reviewed?(correct(x)?'checked':'missed'):(answered(x)?'answered':'');
      return `<button class="${st} ${i===k?'current':''}" data-action="jump" data-index="${k}" aria-label="Câu ${x.number}${answered(x)?', đã trả lời':''}" title="Câu ${x.number}">${k+1}</button>`;
    }).join('')}</div><div class="side-key"><span><i class="key-dot"></i> Chưa làm</span><span><i class="key-dot answer"></i> Đã làm</span><span><i class="key-dot done"></i> Đúng</span></div>
      <div class="side-note">${exam?'🔒 Trong chế độ thi thử, đáp án chỉ được công bố sau khi nộp bài.':'✦ Chọn đáp án rồi bấm “Kiểm tra câu này” để xem đáp án theo tài liệu.'}</div>
      <div class="side-stat"><span>Đã trả lời</span><strong>${s.count}/${s.total}</strong></div><div class="side-stat"><span>Chưa trả lời</span><strong>${s.total-s.count}</strong></div>
      <button class="btn btn-primary full" data-action="submit-lesson" style="margin-top:15px">${readOnly()?'Xem kết quả':'Nộp bài & xem điểm'}</button><button class="btn btn-light full" data-action="restart" style="margin-top:9px">↺ Làm lại bài</button>
    </aside></div>`;
  }
  function renderQuestion(q){
    const a=answer(q),checked=!!saved.checked[q.id]||readOnly(),locked=readOnly(),hint=(t)=>`<div class="instruction">${t}</div>`;
    if(q.type==='single'||q.type==='multi'){
      const label=q.type==='single'?'Chọn một phương án đúng nhất.':`Chọn đúng ${q.expected} phương án theo yêu cầu. Bạn đã chọn ${a.length}/${q.expected}.`;
      return hint('ⓘ '+label)+`<div class="option-list">${q.options.map(opt=>{
        const chosen=a.includes(opt.key),isRight=q.answers.includes(opt.key),status=checked?(chosen?(isRight?'good':'bad'):isRight?'answer-key':''):'';
        return `<button class="option ${chosen?'selected':''} ${status}" data-action="choose" data-key="${opt.key}" ${locked?'disabled':''} aria-pressed="${chosen}"><span class="option-marker">${opt.key}</span><span class="option-text">${format(opt.text)}</span>${checked&&chosen&&isRight?'<span aria-label="Đáp án đã chọn đúng">✓</span>':checked&&chosen?'<span aria-label="Đáp án đã chọn sai">✕</span>':checked&&isRight?'<span aria-label="Đáp án đúng chưa chọn">Đúng</span>':''}</button>`;
      }).join('')}</div>`;
    }
    if(q.type==='tf')return hint('ⓘ Xác định Đúng hoặc Sai cho từng phát biểu. Bạn cần trả lời tất cả các dòng.')+`<div class="tf-list">${q.statements.map((s,i)=>{
      return `<div class="tf-row"><div class="tf-row-header"><span class="tf-num">${i+1}</span><div class="tf-text">${format(s.text)}</div></div><div class="tf-controls">${['Đúng','Sai'].map(x=>`<button class="tf-choice ${a[i]===x?'selected':''} ${checked&&s.answer===x?'good':checked&&a[i]===x?'bad':''}" data-action="tf-choose" data-index="${i}" data-value="${x}" ${locked?'disabled':''} aria-pressed="${a[i]===x}">${x}</button>`).join('')}${checked?`<span style="font-size:12px;align-self:center;color:${a[i]===s.answer?'#159461':'#cf4d52'}">${a[i]===s.answer?'✓':'✕'} ${s.answer}</span>`:''}</div></div>`;
    }).join('')}</div>`;
    if(q.type==='match'){
      const unique=[...new Set(q.choices)];const used=a.filter(Boolean).map(normalize);
      return hint('ⓘ Kéo đáp án vào ô trống hoặc chạm vào thẻ đáp án rồi chạm vào ô cần điền.')+`<div class="bank"><strong>NGÂN HÀNG ĐÁP ÁN</strong><div class="bank-items">${unique.map(choice=>{
        const sel=ui.selectedMatch===choice,occ=used.includes(normalize(choice));
        return `<button class="bank-chip ${sel?'chosen':''} ${occ?'used':''}" data-action="match-select" data-value="${slug(choice)}" data-drag-value="${slug(choice)}" draggable="${!locked}" ${locked?'disabled':''}>${escapeHTML(choice)}</button>`;
      }).join('')}</div></div><div class="match-list">${q.pairs.map((p,i)=>{
        const chosen=a[i],right=normalize(chosen)===normalize(p.answer),status=checked?(right?'good':chosen?'bad':''):'';
        return `<div class="match-row"><div class="tf-num">${i+1}</div><div class="match-statement">${format(p.text)}</div><button class="match-zone ${chosen?'has-value':''} ${status}" data-action="match-target" data-index="${i}" data-match-zone="${i}" ${locked?'disabled':''}>${chosen?escapeHTML(chosen):'Thả / chọn đáp án'} ${chosen&&!locked?'<span class="mini-remove">×</span>':''}</button></div>`;
      }).join('')}</div>`;
    }
    if(q.type==='categorize'){
      const items=categoryItems(q),assigned=items.filter(x=>Number.isInteger(a[x.index])),remaining=items.filter(x=>!Number.isInteger(a[x.index]));
      return hint('ⓘ Kéo các thẻ vào nhóm thích hợp, hoặc chọn thẻ rồi chọn cột. Chạm vào thẻ đã xếp để đưa về ngân hàng.')+
      `<div class="bank"><strong>CÁC YẾU TỐ CẦN PHÂN LOẠI (${remaining.length} còn lại)</strong><div class="bank-items">${remaining.length?remaining.map(item=>catChip(item,false,locked)).join(''):'<span style="font-size:12px;color:#7684a0">Đã phân loại hết các yếu tố.</span>'}</div></div>
      <div class="category-layout">${q.groups.map((g,gi)=>{
        const groupItems=items.filter(x=>a[x.index]===gi);
        return `<div class="category-zone" data-cat-zone="${gi}" data-action="cat-target" data-group="${gi}"><div class="category-header">${escapeHTML(g.title)} &nbsp;<span style="color:#8d9ab0">(${groupItems.length} thẻ)</span></div><div class="category-items">${groupItems.length?groupItems.map(item=>catChip(item,true,locked,checked,item.group===gi)).join(''):'<span class="subtle" style="font-size:12px">Thả thẻ vào đây hoặc bấm chọn cột</span>'}</div></div>`;
      }).join('')}</div>`;
    }
    return '';
  }
  function catChip(item,assigned,locked,checked=false,right=false){
    return `<button class="category-item ${ui.selectedCategory===item.index?'chosen':''} ${checked?(right?'good':'bad'):''}" data-action="${assigned?'cat-clear':'cat-select'}" data-item="${item.index}" data-drag-cat="${item.index}" draggable="${!locked}" ${locked?'disabled':''} title="${assigned?'Bấm để trả lại ngân hàng':'Bấm chọn rồi chọn cột'}">${escapeHTML(item.text)}${assigned&&!locked?' ×':''}</button>`;
  }
  function renderFeedback(q){
    const wasChecked=saved.checked[q.id]||readOnly();
    if(!wasChecked)return '';
    const ok=correct(q),klass=ok?'success':'failure';
    let text='';
    if(q.type==='single'||q.type==='multi')text=`Đáp án theo tài liệu: <strong style="display:inline">${q.answers.join(', ')}</strong> — ${q.options.filter(o=>q.answers.includes(o.key)).map(o=>escapeHTML(o.text)).join('; ')}`;
    if(q.type==='tf')text=`Đáp án theo thứ tự: ${q.statements.map((s,i)=>`${i+1}. ${s.answer}`).join(' · ')}`;
    if(q.type==='match')text=`Ghép đúng: ${q.pairs.map((p,i)=>`${i+1}. ${escapeHTML(p.answer)}`).join(' · ')}`;
    if(q.type==='categorize')text=`Phân loại theo tài liệu: ${q.groups.map(g=>`${escapeHTML(g.title)}: ${g.items.map(escapeHTML).join(', ')}`).join(' | ')}`;
    return `<div class="explain ${klass}"><strong>${ok?'✓ Chính xác!':'✕ Chưa chính xác'}</strong>${text}</div>`;
  }
  function results(){
    const l=currentLesson();let result=saved.submissions[l.id];
    if(!result){ui.page='quiz';return quiz();}
    const percent=Math.round(result.score*100/l.questions.length),good=percent>=80;
    let rows=l.questions.map((q,i)=>({q,i,ok:correct(q)}));
    if(ui.resultFilter==='wrong')rows=rows.filter(x=>!x.ok);
    return `<section class="page-heading"><div><div class="eyebrow">KẾT QUẢ BÀI KIỂM TRA</div><h1>Bài ${l.id} · Hoàn thành!</h1><p class="subtle">${escapeHTML(l.title)}</p></div><button class="btn btn-light" data-action="home">← Về tổng quan</button></section>
      <section class="content-card result-hero"><div class="result-medal">${percent===100?'🏆':good?'🎉':'📘'}</div><h1>${percent===100?'Xuất sắc!':good?'Làm tốt lắm!':'Đã hoàn thành bài học'}</h1><p class="subtle">Dưới đây là kết quả chấm tự động theo đáp án của tài liệu.</p><div class="result-percent">${percent}%</div>
        <div class="result-stats"><div class="result-item"><strong>${result.score}</strong><small>Câu chính xác</small></div><div class="result-item"><strong>${l.questions.length-result.score}</strong><small>Câu chưa đúng</small></div><div class="result-item"><strong>${elapsed(result.duration||0)}</strong><small>Thời gian</small></div></div>
        <div class="result-actions"><button class="btn btn-primary" data-action="review">Xem lại từng câu →</button><button class="btn btn-light" data-action="export">↓ Xuất kết quả CSV</button><button class="btn btn-light" data-action="restart">↺ Làm lại từ đầu</button></div></section>
      <section class="content-card result-list" style="margin-top:21px"><div class="section-heading"><h2>Chi tiết câu hỏi</h2><div class="mode-switch"><button class="${ui.resultFilter==='all'?'selected':''}" data-action="result-filter" data-value="all">Tất cả</button><button class="${ui.resultFilter==='wrong'?'selected':''}" data-action="result-filter" data-value="wrong">Chưa đúng</button></div></div>
      ${rows.length?rows.map(({q,i,ok})=>`<div class="result-row"><span class="result-indicator ${ok?'ok':'no'}">${ok?'✓':'✕'}</span><div class="result-info"><strong>Câu ${q.number} · ${TYPE_LABEL[q.type]}</strong><small>${escapeHTML(q.prompt)}</small></div><button class="btn btn-light btn-xs" data-action="review-question" data-index="${i}">Xem lại →</button></div>`).join(''):'<p class="subtle">Bạn không có câu trả lời sai. Tuyệt vời!</p>'}</section>`;
  }
  function openLesson(id){
    if(Number(id)===aggregateLesson.id&&session.role!=='admin'){
      toast('Chỉ quản trị viên mới được mở bài tổng hợp.');return;
    }
    const l=lessonById(id);if(!l)return;
    ui.lesson=l.id;ui.index=0;ui.selectedMatch=null;ui.selectedCategory=null;ui.resultFilter='all';
    if(mode(id)==='exam')ensureExamOrder(l);
    if(!saved.starts[id])saved.starts[id]=Date.now();
    ui.page=submitted(id)?'results':'quiz';store();render();window.scrollTo({top:0,behavior:'instant'});
  }
  function showQuestion(index){const l=currentLesson();if(index<0||index>=l.questions.length)return;ui.index=index;ui.page='quiz';ui.selectedMatch=null;ui.selectedCategory=null;render();window.scrollTo({top:0,behavior:'instant'});}
  function changeAnswer(q,newAnswer){if(readOnly())return;saved.answers[q.id]=newAnswer;delete saved.checked[q.id];store();render();}
  function submitLesson(){
    const l=currentLesson();if(submitted(l.id)){ui.page='results';render();return;}
    const s=lessonStats(l),missing=s.total-s.count;
    if(missing&&!window.confirm(`Bạn còn ${missing} câu chưa trả lời đầy đủ. Bạn vẫn muốn nộp bài và tính các câu đó là chưa đúng?`))return;
    const score=l.questions.reduce((sum,q)=>sum+(correct(q)?1:0),0);
    saved.submissions[l.id]={score,total:l.questions.length,answered:s.count,duration:Date.now()-(saved.starts[l.id]||Date.now()),time:new Date().toISOString(),mode:mode(l.id)};
    store();ui.page='results';ui.resultFilter='all';render();window.scrollTo({top:0,behavior:'instant'});
    toast(`Đã nộp Bài ${l.id}: ${score}/${l.questions.length} câu chính xác.`);
  }
  function restartLesson(){
    const l=currentLesson();if(!window.confirm(`Làm lại Bài ${l.id}? Tất cả câu trả lời và kết quả của bài này sẽ bị xóa.`))return;
    for(const q of l.questions){delete saved.answers[q.id];delete saved.checked[q.id];}
    delete saved.submissions[l.id];saved.starts[l.id]=Date.now();
    if(mode(l.id)==='exam'){
      delete saved.orders[l.id];
      for(const q of l.questions)delete saved.optionOrders[q.id];
      ensureExamOrder(l);
    }
    ui.index=0;ui.page='quiz';ui.selectedMatch=null;ui.selectedCategory=null;
    store();render();window.scrollTo({top:0,behavior:'instant'});toast(`Đã khởi động lại Bài ${l.id}.`);
  }
  function exportCSV(){
    const l=currentLesson(),result=saved.submissions[l.id];if(!result)return;
    const columns=['Bài','Câu trong tài liệu','Dạng câu','Nội dung','Đã trả lời','Kết quả','Đáp án'];
    const lines=[columns,...l.questions.map(q=>{
      const a=answer(q);
      const entered=Array.isArray(a)?a.join(' / '):categoryItems(q).filter(x=>Number.isInteger(a[x.index])).map(x=>`${x.text} → ${q.groups[a[x.index]].title}`).join(' / ');
      const key=q.type==='single'||q.type==='multi'?q.answers.join(', '):q.type==='tf'?q.statements.map(x=>x.answer).join(' / '):q.type==='match'?q.pairs.map(x=>x.answer).join(' / '):q.groups.map(g=>`${g.title}: ${g.items.join('; ')}`).join(' / ');
      return [l.id,q.number,TYPE_LABEL[q.type],q.prompt,entered,correct(q)?'Đúng':'Sai',key];
    })].map(row=>row.map(cell=>'"'+String(cell??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const content='\uFEFF'+lines,blob=new Blob([content],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`Ket_qua_CNXHKH_Bai_${l.id}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  function assignMatch(index,value){
    const q=currentQuestion();if(q.type!=='match'||readOnly())return;
    const a=[...answer(q)];const existing=a.findIndex((v,i)=>i!==index && normalize(v)===normalize(value));if(existing>=0)a[existing]='';
    a[index]=value;ui.selectedMatch=null;changeAnswer(q,a);
  }
  function assignCategory(itemIndex,group){
    const q=currentQuestion();if(q.type!=='categorize'||readOnly())return;
    if(!categoryItems(q).some(x=>x.index===itemIndex)||!q.groups[group])return;
    const a={...answer(q)};a[itemIndex]=group;ui.selectedCategory=null;changeAnswer(q,a);
  }
  document.addEventListener('click',(event)=>{
    const b=event.target.closest('[data-action]');if(!b||b.disabled)return;
    const action=b.dataset.action,idx=asNumber(b.dataset.index),q=currentQuestion();
    if(action!=='toggle-menu')el('sidebar').classList.remove('open');
    switch(action){
      case 'home': case 'all-lessons':ui.page='dashboard';render();window.scrollTo(0,0);break;
      case 'toggle-menu':el('sidebar').classList.toggle('open');break;
      case 'open-lesson':openLesson(b.dataset.lesson);break;
      case 'previous':showQuestion(ui.index-1);break;
      case 'next':showQuestion(ui.index+1);break;
      case 'jump':showQuestion(idx);break;
      case 'choose':{
        if(readOnly()||!q)return;let a=[...answer(q)],key=b.dataset.key;
        if(q.type==='single')a=[key];
        else if(a.includes(key))a=a.filter(x=>x!==key);
        else if(a.length>=q.expected){toast(`Câu này chỉ được chọn ${q.expected} đáp án.`);return;}
        else a.push(key);
        changeAnswer(q,a);break;
      }
      case 'tf-choose':{
        if(readOnly())return;const a=[...answer(q)];a[idx]=b.dataset.value;changeAnswer(q,a);break;
      }
      case 'match-select':{
        if(readOnly())return;const value=unslug(b.dataset.value);
        ui.selectedMatch=ui.selectedMatch===value?null:value;render();break;
      }
      case 'match-target':{
        if(readOnly())return;const a=[...answer(q)];
        if(ui.selectedMatch)assignMatch(idx,ui.selectedMatch);
        else if(a[idx]){a[idx]='';changeAnswer(q,a);}
        else toast('Chọn một thẻ đáp án phía trên trước.');break;
      }
      case 'cat-select':{
        if(readOnly())return;const item=asNumber(b.dataset.item);
        ui.selectedCategory=ui.selectedCategory===item?null:item;render();break;
      }
      case 'cat-target':{
        if(readOnly())return;
        if(ui.selectedCategory!==null)assignCategory(ui.selectedCategory,asNumber(b.dataset.group));
        else toast('Chọn một yếu tố trong ngân hàng trước.');break;
      }
      case 'cat-clear':{
        if(readOnly())return;const item=asNumber(b.dataset.item),a={...answer(q)};delete a[item];changeAnswer(q,a);break;
      }
      case 'check':{
        if(!answered(q)){toast('Vui lòng trả lời đủ nội dung câu hỏi.');return;}
        saved.checked[q.id]=true;store();render();toast(correct(q)?'Chính xác!':'Đã hiện đáp án để bạn ôn tập.');break;
      }
      case 'mode':{
        const next=b.dataset.mode;if(submitted(ui.lesson)){toast('Bài đã nộp. Hãy bấm "Làm lại bài" để đổi chế độ.');return;}
        if(next===mode(ui.lesson))return;
        if(currentLesson().questions.some(x=>saved.answers[x.id])){
          if(!window.confirm('Đổi chế độ sẽ xóa các câu đã chọn của bài này để đảm bảo tính nhất quán. Tiếp tục?'))return;
          for(const x of currentLesson().questions){delete saved.answers[x.id];delete saved.checked[x.id];}
          ui.index=0;
        }
        saved.modes[ui.lesson]=next;saved.starts[ui.lesson]=Date.now();
        if(next==='exam'){
          delete saved.orders[ui.lesson];
          for(const x of currentLesson().questions)delete saved.optionOrders[x.id];
          ensureExamOrder(currentLesson());
        }
        store();render();break;
      }
      case 'submit-lesson':submitLesson();break;
      case 'restart':restartLesson();break;
      case 'review':ui.page='quiz';ui.index=0;render();window.scrollTo(0,0);break;
      case 'review-question':ui.page='quiz';showQuestion(idx);break;
      case 'result-filter':ui.resultFilter=b.dataset.value;render();break;
      case 'export':exportCSV();break;
      case 'reset-all':{
        if(!window.confirm('Bạn có chắc muốn xóa toàn bộ tiến độ và kết quả của 6 bài?'))return;
        saved=defaultSaved();store();ui={page:'dashboard',lesson:1,index:0,selectedMatch:null,selectedCategory:null,resultFilter:'all'};render();toast('Đã đặt lại toàn bộ tiến độ.');break;
      }
      default:break;
    }
  });
  document.addEventListener('dragstart',event=>{
    const node=event.target.closest('[data-drag-value],[data-drag-cat]');if(!node||node.disabled)return;
    const q=currentQuestion();if(!q||readOnly())return;
    if(node.dataset.dragValue!==undefined)event.dataTransfer.setData('text/plain',JSON.stringify({type:'match',value:unslug(node.dataset.dragValue),q:q.id}));
    else if(node.dataset.dragCat!==undefined)event.dataTransfer.setData('text/plain',JSON.stringify({type:'category',item:asNumber(node.dataset.dragCat),q:q.id}));
    event.dataTransfer.effectAllowed='move';
  });
  document.addEventListener('dragover',event=>{
    const zone=event.target.closest('[data-match-zone],[data-cat-zone]');if(!zone||readOnly())return;
    event.preventDefault();event.dataTransfer.dropEffect='move';zone.classList.add('drag-over');
  });
  document.addEventListener('dragleave',event=>{
    const zone=event.target.closest('[data-match-zone],[data-cat-zone]');
    if(zone&&!zone.contains(event.relatedTarget))zone.classList.remove('drag-over');
  });
  document.addEventListener('drop',event=>{
    const zone=event.target.closest('[data-match-zone],[data-cat-zone]');if(!zone||readOnly())return;
    event.preventDefault();zone.classList.remove('drag-over');let payload;
    try{payload=JSON.parse(event.dataTransfer.getData('text/plain'));}catch{return;}
    if(payload.q!==currentQuestion()?.id)return;
    if(payload.type==='match'&&zone.dataset.matchZone!==undefined)assignMatch(asNumber(zone.dataset.matchZone),payload.value);
    if(payload.type==='category'&&zone.dataset.catZone!==undefined)assignCategory(payload.item,asNumber(zone.dataset.catZone));
  });
  setInterval(()=>{
    if(!el('app').querySelector('.elapsed')||ui.page!=='quiz')return;
    const node=el('app').querySelector('.elapsed'),start=Number(node.dataset.start);
    if(start)node.textContent=elapsed(Date.now()-start);
  },1000);
  setupAccountBar();headerClock();render();
  if(session.role==='admin'&&new URLSearchParams(window.location.search).get('view')==='aggregate'){
    openLesson(aggregateLesson.id);
  }
})();
