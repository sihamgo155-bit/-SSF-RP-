(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const read = (key, fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { alert('La sauvegarde locale est pleine ou indisponible.'); return false; } };
  const escapeText = (value) => String(value ?? '');
  const initials = name => (String(name||'SSF').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase() || 'SSF');
  let profile = read('ssf-member-profile-v3', null);
  let applications = read('ssf-member-applications-v3', []);
  let approved = read('ssf-approved-members-v3', []);
  let avatarData = profile?.avatar || '';
  const ranks = ['Recrue','Soldat','Capo','Conseiller','Co-Commandant','Commandant'];
  const rankLabels = {Recrue:'Recrue',Soldat:'Soldat',Capo:'Capo',Conseiller:'Conseiller', 'Co-Commandant':'Co-Commandant',Commandant:'Commandant'};
  const toast = message => { const el=$('#toast'); if(el){el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600);} else alert(message); };
  const avatarMarkup = (url, name, cls='') => { if(url){ const img=document.createElement('img'); img.src=url; img.alt=`Photo de ${name}`; img.className=cls; return img; } const span=document.createElement('span'); span.className=cls; span.textContent=initials(name); return span; };
  function renderProfile(){
    const name=profile?.accountName || '';
    const big=$('#profileAvatarPreview'); big.replaceChildren(); big.append(avatarMarkup(profile?.avatar,name,'avatar-image'));
    $('#profilePreviewName').textContent=name || 'Aucun profil enregistré';
    $('#profilePreviewRank').textContent=profile?.rank ? `Grade : ${profile.rank}` : 'Statut : visiteur';
    $('#profilePreviewStatus').textContent=profile?.status==='accepted'?'MEMBRE ACCEPTÉ':(profile?'PROFIL ENREGISTRÉ':'PROFIL NON CRÉÉ');
    $('#topAvatar').replaceChildren(); $('#topAvatar').append(avatarMarkup(profile?.avatar,name,'avatar-image'));
    $('#topProfileName').textContent=name || 'MON PROFIL';
    $('#applicationAccountName').value=name;
    $('#applicationAccountName').readOnly=true;
    $('#applicationAvatar').replaceChildren(); $('#applicationAvatar').append(avatarMarkup(profile?.avatar,name,'avatar-image'));
    $('#applicationProfileText').textContent=name ? `Candidature au nom de ${name}` : 'Créez d’abord votre profil membre.';
    $('#applicationForm button[type="submit"]').disabled=!name;
    if(name) $('#profileForm [name="accountName"]').value=name;
  }
  $('#profileForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const name=String(new FormData(e.currentTarget).get('accountName')||'').trim();
    if(name.length<2){toast('Saisissez le nom exact de votre compte.');return;}
    const file=$('#avatarFile').files?.[0];
    let avatar=avatarData;
    if(file){
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)){toast('Format accepté : PNG, JPG ou WEBP.');return;}
      if(file.size>2*1024*1024){toast('Choisissez une image de moins de 2 Mo.');return;}
      avatar=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>resolve('');reader.readAsDataURL(file);});
    }
    const priorStatus=profile?.status==='accepted'?'accepted':'pending';
    profile={accountName:name,avatar,rank:profile?.rank||'Visiteur',status:priorStatus,updatedAt:new Date().toISOString()};
    avatarData=avatar;
    if(!write('ssf-member-profile-v3',profile))return;
    $('#profileFeedback').textContent='Profil enregistré sur cet appareil. Le nom de compte n’est pas vérifié automatiquement.';
    renderProfile();toast('Profil membre enregistré.');
  });
  $('#profileLogout').addEventListener('click',()=>{
    if(!confirm('Effacer le profil enregistré sur cet appareil ?'))return;
    profile=null;avatarData='';$('#profileForm').reset();write('ssf-member-profile-v3',null);renderProfile();toast('Profil effacé de cet appareil.');
  });
  // Replace the previous local preview handler with a richer application queue.
  const oldForm=$('#applicationForm'); const formClone=oldForm.cloneNode(true); oldForm.replaceWith(formClone);
  formClone.addEventListener('submit',e=>{
    e.preventDefault();
    if(!profile?.accountName){toast('Créez d’abord votre profil membre.');location.hash='#profile';return;}
    const f=new FormData(formClone); const name=String(f.get('name')||'').trim();
    if(name!==profile.accountName){toast('Le nom doit correspondre au profil enregistré.');return;}
    const app={id:`app-${Date.now()}-${Math.random().toString(16).slice(2,7)}`,accountName:profile.accountName,avatar:profile.avatar||'',age:String(f.get('age')||''),role:String(f.get('role')||''),motivation:String(f.get('motivation')||'').trim(),status:'pending',submittedAt:new Date().toISOString()};
    applications=applications.filter(x=>x.accountName.toLowerCase()!==app.accountName.toLowerCase());applications.push(app);
    profile.status='pending';write('ssf-member-profile-v3',profile);write('ssf-member-applications-v3',applications);
    $('#formFeedback').textContent='Candidature ajoutée à la file locale. Un administrateur doit vérifier le nom du compte manuellement.';
    renderProfile();renderApplications();toast('Candidature enregistrée localement.');
  });
  function createAvatar(url,name){return avatarMarkup(url,name,'avatar-image');}
  function renderApplications(){
    const list=$('#applicationReviewList');list.replaceChildren();
    if(!applications.length){const p=document.createElement('p');p.className='empty-admin';p.textContent='Aucune candidature locale pour le moment.';list.append(p);} 
    applications.slice().reverse().forEach(app=>{
      const card=document.createElement('article');card.className='review-card';
      const head=document.createElement('div');head.className='review-person';const av=document.createElement('div');av.className='review-avatar';av.append(createAvatar(app.avatar,app.accountName));const ident=document.createElement('div');const title=document.createElement('h4');title.textContent=app.accountName;const meta=document.createElement('p');meta.textContent=`${app.role} · ${app.age} ans · ${new Date(app.submittedAt).toLocaleDateString()}`;const status=document.createElement('span');status.className=`review-status status-${app.status}`;status.textContent=app.status==='accepted'?'ACCEPTÉE':app.status==='rejected'?'REFUSÉE':'EN ATTENTE';ident.append(title,meta,status);head.append(av,ident);card.append(head);
      const motivation=document.createElement('p');motivation.className='review-motivation';motivation.textContent=app.motivation;card.append(motivation);
      if(app.status==='pending'){
        const controls=document.createElement('div');controls.className='review-controls';const select=document.createElement('select');select.setAttribute('aria-label','Grade à attribuer');ranks.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent=r;select.append(o);});
        const accept=document.createElement('button');accept.type='button';accept.className='btn btn-red';accept.textContent='ACCEPTER + ATTRIBUER LE GRADE';accept.addEventListener('click',()=>{const member={accountName:app.accountName,avatar:app.avatar,rank:select.value,acceptedAt:new Date().toISOString()};approved=approved.filter(m=>m.accountName.toLowerCase()!==member.accountName.toLowerCase());approved.push(member);app.status='accepted';app.rank=member.rank;if(profile?.accountName.toLowerCase()===app.accountName.toLowerCase()){profile.status='accepted';profile.rank=member.rank;write('ssf-member-profile-v3',profile);renderProfile();}write('ssf-member-applications-v3',applications);write('ssf-approved-members-v3',approved);renderApplications();toast(`تم قبول ${app.accountName} برتبة ${member.rank}`);});
        const reject=document.createElement('button');reject.type='button';reject.className='btn btn-outline';reject.textContent='رفض';reject.addEventListener('click',()=>{app.status='rejected';write('ssf-member-applications-v3',applications);renderApplications();toast('تم تحديث حالة الطلب.');});controls.append(select,accept,reject);card.append(controls);
      } else if(app.status==='accepted'){const rank=document.createElement('p');rank.className='approved-rank';rank.textContent=`الرتبة المعتمدة: ${app.rank||'Recrue'}`;card.append(rank);}
      list.append(card);
    });
    const members=$('#approvedMembersList');members.replaceChildren();
    if(!approved.length){const p=document.createElement('p');p.className='empty-admin';p.textContent='Les membres acceptés apparaîtront ici.';members.append(p);return;}
    approved.forEach(member=>{const row=document.createElement('article');row.className='approved-member';const av=document.createElement('div');av.className='review-avatar';av.append(createAvatar(member.avatar,member.accountName));const info=document.createElement('div');const name=document.createElement('h4');name.textContent=member.accountName;const rank=document.createElement('p');rank.textContent=member.rank;info.append(name,rank);row.append(av,info);members.append(row);});
  }
  renderProfile();renderApplications();

  // Real bilingual toggle: translate all text nodes/labels/placeholders and switch page direction.
  const translations={
    'Vue générale':'نظرة عامة','Missions & tâches':'المهام والتكليفات','Annonces':'الإعلانات','Unités & grades':'الوحدات والرتب','Académie / QCM':'الأكاديمية / اختبار','Recrutement':'الانضمام','Profil membre':'الملف الشخصي','Espace Admin':'لوحة الإدارة','MON PROFIL':'ملفي الشخصي','REJOINDRE LA SSF':'الانضمام إلى SSF',
    'SYSTÈME OPÉRATIONNEL':'النظام يعمل','PORTAIL COMMUNAUTAIRE':'بوابة المجتمع','CENTRE DE COMMANDEMENT':'مركز القيادة','ORDRE • RESPECT • DISCIPLINE':'النظام • الاحترام • الانضباط','Un univers Roleplay fictif, construit par la communauté.':'مجتمع لعب أدوار خيالي من تنظيم الأعضاء.','TABLEAU DE BORD':'لوحة القيادة','HEURE LOCALE':'التوقيت المحلي',
    'DOSSIER CENTRAL // ACCÈS COMMUNAUTAIRE':'المركز الرئيسي // بوابة الأعضاء','LA MISSION':'المهمة','NE S’ARRÊTE':'لا تتوقف','NE S\'ARRÊTE':'لا تتوقف','JAMAIS.':'أبداً.','Bienvenue au centre SSF Morocco RP. Consultez les consignes, suivez les missions, découvrez les unités et préparez votre candidature.':'مرحباً بك في مركز SSF Morocco RP. تابع التعليمات والمهام، تعرّف على الوحدات، وجهّز طلب الانضمام.','ACCÉDER AUX MISSIONS':'عرض المهام','ESPACE ADMIN':'لوحة الإدارة','PORTAIL COMMUNAUTAIRE':'بوابة المجتمع','RÉFÉRENCE :':'المرجع:','STATUT DU RÉSEAU':'حالة الشبكة','CONNECTÉ':'متصل','NIVEAU':'المستوى','COMMUNAUTÉ':'المجتمع','SECTEUR':'القطاع','MAROC / RP':'المغرب / لعب الأدوار','AVIS CENTRAL':'إعلان مركزي','MISSIONS PUBLIÉES':'المهام المنشورة','Tâches communautaires':'مهام المجتمع','ANNONCES CENTRALES':'الإعلانات المركزية','Informations récentes':'آخر المعلومات','UNITÉS STRUCTURÉES':'الوحدات المنظمة','Organisation Roleplay':'تنظيم لعب الأدوار','OUVERT':'مفتوح','Candidatures communautaires':'طلبات الانضمام',
    'OBJECTIFS PRIORITAIRES':'الأهداف ذات الأولوية','MISSIONS':'المهام','Les consignes publiées pour la communauté. Choisissez une mission pour consulter son brief.':'التعليمات المنشورة للأعضاء. اختر مهمة للاطلاع على تفاصيلها.','PUBLIER UNE TÂCHE':'نشر مهمة','PRIORITÉ HAUTE':'أولوية عالية','PRIORITÉ NORMALE':'أولوية عادية','PRIORITÉ BASSE':'أولوية منخفضة','Briefing de la semaine':'اجتماع الأسبوع','Consulter les règles RP, les consignes générales et les objectifs communautaires.':'راجع قواعد لعب الأدوار والتعليمات العامة وأهداف المجتمع.','Préparation des recrues':'إعداد الأعضاء الجدد','Découvrir la charte, les rôles disponibles et les critères d’intégration.':'تعرّف على الميثاق والأدوار المتاحة وشروط الانضمام.','Entraînement QCM':'تدريب الاختبار','Passer le test de démonstration et vérifier sa compréhension des règles.':'أجرِ الاختبار التجريبي وتأكد من فهمك للقواعد.','CONSULTER LE BRIEF':'عرض التفاصيل','LANCER L’ENTRAÎNEMENT':'بدء التدريب','RÉCURRENT':'متكرر','ÉQUIPE SSF':'فريق SSF','À FAIRE':'مطلوب إنجازه','RECRUTEMENT':'الانضمام','ACADÉMIE':'الأكاديمية',
    'TRANSMISSIONS':'الرسائل','ANNONCES':'الإعلانات','Les nouvelles et messages publiés par l’administration du site.':'الأخبار والرسائل التي تنشرها إدارة الموقع.','FIL D’INFORMATION':'موجز الأخبار','COMMUNICATION GÉNÉRALE':'تواصل عام','Bienvenue au sein de SSF Morocco RP':'مرحباً بك في SSF Morocco RP','Respectez la charte, gardez un esprit d’équipe et consultez régulièrement les mises à jour.':'احترم الميثاق، تعاون مع الفريق، وتابع التحديثات بانتظام.','Les candidatures sont ouvertes':'طلبات الانضمام مفتوحة','Présentez votre profil et votre motivation dans le formulaire en bas de page.':'قدّم ملفك الشخصي ودوافعك عبر الاستمارة.','ACTIF':'نشط','ORGANISATION':'التنظيم','UNITÉS':'الوحدات','Une hiérarchie communautaire claire pour un Roleplay cohérent.':'هيكل تنظيمي واضح لمجتمع لعب أدوار منظم.','Commandement':'القيادة','Coordination, arbitrage et orientation de la communauté.':'التنسيق وحل الخلافات وتوجيه المجتمع.','LEADERSHIP':'القيادة','Opérations RP':'عمليات لعب الأدوار','Organisation des activités et respect du cadre Roleplay.':'تنظيم الأنشطة واحترام قواعد لعب الأدوار.','OPÉRATIONS':'العمليات','Formation':'التكوين','Accueil, apprentissage, préparation et évaluations.':'الاستقبال والتعلم والتحضير والتقييم.','Support':'الدعم','Orientation des membres et traitement des questions.':'توجيه الأعضاء والإجابة عن الاستفسارات.','ASSISTANCE':'المساعدة','SSF Morocco RP est un projet communautaire fictif. Les noms et unités présentés ici ne représentent pas une institution officielle réelle.':'SSF Morocco RP مشروع مجتمعي خيالي ولا يمثل أي مؤسسة رسمية حقيقية.',
    'ACADÉMIE SSF':'أكاديمية SSF','CONNAÎTRE LES':'تعرّف على','RÈGLES DU JEU.':'قواعد المجتمع.','Testez vos réflexes communautaires avec un QCM rapide. Votre score est calculé sur cet appareil.':'اختبر فهمك لقواعد المجتمع عبر اختبار قصير. تُحسب النتيجة على هذا الجهاز.','QUESTIONS DE DÉMO':'أسئلة تجريبية','UNE SEULE RÉPONSE PAR QUESTION':'إجابة واحدة لكل سؤال','ÉVALUATION / DÉMO':'اختبار تجريبي','Sélectionnez une réponse.':'اختر إجابة.','VALIDER':'تأكيد','TERMINER':'إنهاء','RÉSULTAT DE L’ÉVALUATION':'نتيجة الاختبار','Votre score :':'نتيجتك:','RECOMMENCER':'إعادة المحاولة',
    'NOUS REJOINDRE':'انضم إلينا','VOTRE PLACE':'مكانك','VOUS ATTEND.':'ينتظرك.','Envoyez votre candidature pour rejoindre l’univers communautaire SSF Morocco RP.':'أرسل طلبك للانضمام إلى مجتمع SSF Morocco RP.','PRÉSENTEZ-VOUS':'عرّف بنفسك','EXPLIQUEZ VOTRE MOTIVATION':'اشرح دوافعك','LISEZ LA CHARTE':'اقرأ الميثاق','FORMULAIRE D’INTÉGRATION':'استمارة الانضمام','SSF / RECRUTEMENT':'SSF / الانضمام','NOM EXACT DU COMPTE':'اسم الحساب الصحيح','ÂGE':'العمر','POSTE SOUHAITÉ':'الدور المطلوب','Sélectionner un rôle':'اختر دوراً','MOTIVATION':'الدافع','Pourquoi souhaitez-vous rejoindre SSF ? (20 caractères minimum)':'لماذا تريد الانضمام إلى SSF؟ (20 حرفاً على الأقل)','J’accepte la charte communautaire et confirme l’exactitude des informations.':'أوافق على ميثاق المجتمع وأؤكد صحة المعلومات.','PRÉPARER MA CANDIDATURE':'تقديم طلب الانضمام','Créer d’abord votre profil membre.':'أنشئ ملفك الشخصي أولاً.','Candidature au nom de':'طلب باسم','Profil enregistré sur cet appareil. Le nom de compte n’est pas vérifié automatiquement.':'تم حفظ الملف على هذا الجهاز. لا يتم التحقق من اسم الحساب تلقائياً.',
    'IDENTITÉ MEMBRE':'هوية العضو','VOTRE PROFIL':'ملفك الشخصي','SSF OFFICIEL.':'ملف SSF','Créez votre fiche membre avec le nom exact de votre compte et votre photo. Les informations seront reprises dans votre candidature.':'أنشئ ملف العضو باستخدام اسم حسابك الصحيح وصورتك. ستُستخدم هذه المعلومات في طلب الانضمام.','PROFIL MEMBRE':'ملف العضو','Aucun profil enregistré':'لا يوجد ملف محفوظ','Statut : visiteur':'الحالة: زائر','PROFIL NON CRÉÉ':'لم يتم إنشاء الملف','CRÉER / MODIFIER MON PROFIL':'إنشاء / تعديل ملفي','SSF / MEMBRE':'SSF / عضو','PHOTO DE PROFIL':'صورة الملف الشخصي','PNG, JPG ou WEBP. Choisissez une photo ou un avatar que vous avez le droit d’utiliser.':'PNG أو JPG أو WEBP. استخدم صورة تملك حق استخدامها.','ENREGISTRER MON PROFIL':'حفظ ملفي الشخصي','EFFACER CE PROFIL DE CET APPAREIL':'مسح الملف من هذا الجهاز','Démo locale : ce profil n’est pas un compte sécurisé et n’est pas partagé entre appareils.':'نسخة تجريبية: هذا الملف ليس حساباً آمناً ولا تتم مشاركته بين الأجهزة.','MEMBRE ACCEPTÉ':'عضو مقبول','Grade :':'الرتبة:','Profil enregistré':'تم حفظ الملف','ESPACE':'المساحة','ADMIN':'الإدارة','ZONE DE GESTION':'منطقة الإدارة','Créez des tâches et publiez des annonces directement sur cette page.':'أنشئ المهام وانشر الإعلانات من هذه الصفحة.','MODE DÉMONSTRATION':'وضع تجريبي','SAUVEGARDE SUR CET APPAREIL':'الحفظ على هذا الجهاز','ACCÈS ADMINISTRATEUR':'دخول الإدارة','Cette zone est réservée aux administrateurs SSF. Entrez le code d’accès pour ouvrir le centre de gestion.':'هذه المنطقة مخصصة لإدارة SSF. أدخل رمز الدخول لفتح مركز التحكم.','CODE D’ACCÈS':'رمز الدخول','DÉVERROUILLER LE CENTRE':'فتح مركز التحكم','ACCÈS PROTÉGÉ · CODE REQUIS':'الوصول محمي · الرمز مطلوب','SESSION ADMIN NON OUVERTE':'جلسة الإدارة غير مفتوحة','SESSION ADMIN ACTIVE':'جلسة الإدارة نشطة','VERROUILLER':'قفل','CANDIDATURES & MEMBRES':'الطلبات والأعضاء','Vérifiez le nom du compte manuellement, puis acceptez ou refusez la candidature et attribuez un grade.':'تحقق من اسم الحساب يدوياً، ثم اقبل الطلب أو ارفضه وحدد الرتبة.','MEMBRES ACCEPTÉS':'الأعضاء المقبولون','PUBLIER UNE TÂCHE':'نشر مهمة','Ajouter une mission au tableau de bord':'إضافة مهمة إلى لوحة القيادة','TITRE DE LA TÂCHE':'عنوان المهمة','DESCRIPTION':'الوصف','PRIORITÉ':'الأولوية','UNITÉ':'الوحدة','Tous les membres':'جميع الأعضاء','PUBLIER LA TÂCHE':'نشر المهمة','PUBLIER UNE ANNONCE':'نشر إعلان','Envoyer un message sur le fil central':'إرسال رسالة في الموجز المركزي','TITRE DE L’ANNONCE':'عنوان الإعلان','MESSAGE':'الرسالة','CATÉGORIE':'الفئة','PUBLIER L’ANNONCE':'نشر الإعلان','CONTENU PUBLIÉ':'المحتوى المنشور','RÉINITIALISER LES AJOUTS':'مسح الإضافات','SUPPRIMER':'حذف','RETOUR EN HAUT':'العودة للأعلى','DISCIPLINE. LOYAUTÉ. MISSION.':'الانضباط. الولاء. المهمة.','COMPRIS':'تم','Profil membre':'الملف الشخصي'
  };
  let arabic=false;
  const originalText=new WeakMap();
  function translateTextNode(node){
    const current=node.nodeValue;const trimmed=current.trim();if(!trimmed)return;
    if(!originalText.has(node))originalText.set(node,trimmed);
    const source=originalText.get(node);const translated=translations[source];
    if(arabic && translated){const leading=current.match(/^\s*/)?.[0]||'';const trailing=current.match(/\s*$/)?.[0]||'';node.nodeValue=leading+translated+trailing;}
    else if(!arabic)node.nodeValue=(current.match(/^\s*/)?.[0]||'')+source+(current.match(/\s*$/)?.[0]||'');
  }
  function applyLanguage(){
    document.documentElement.lang=arabic?'ar':'fr';document.documentElement.dir=arabic?'rtl':'ltr';document.body.classList.toggle('arabic-mode',arabic);
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))translateTextNode(node);
    $$('input[placeholder],textarea[placeholder]').forEach(el=>{if(!el.dataset.originalPlaceholder)el.dataset.originalPlaceholder=el.placeholder;const original=el.dataset.originalPlaceholder;el.placeholder=arabic?(translations[original]||original):original;});
    $('#langBtn').innerHTML=arabic?'عربي <span>⌄</span>':'FR <span>⌄</span>';
  }
  // Remove the old direction-only toggle handler and replace it with a full translated mode.
  const oldLang=$('#langBtn');const newLang=oldLang.cloneNode(true);oldLang.replaceWith(newLang);
  newLang.addEventListener('click',()=>{arabic=!arabic;applyLanguage();});
  const rerenderObserver=new MutationObserver(records=>{if(arabic)records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE)translateTextNode(n);else if(n.nodeType===Node.ELEMENT_NODE){const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let t;while((t=w.nextNode()))translateTextNode(t);}}));});
  rerenderObserver.observe(document.body,{subtree:true,childList:true});
  // Arabic typography and profile widgets.
  applyLanguage();
  const sectionLabelMap={home:'TABLEAU DE BORD',missions:'MISSIONS & TÂCHES',announcements:'ANNONCES CENTRALES',units:'UNITÉS & STRUCTURE',academy:'ACADÉMIE SSF',profile:'PROFIL MEMBRE',apply:'RECRUTEMENT',admin:'ESPACE ADMIN'};
  // Update section observer for the new profile anchor in the breadcrumb.
  const profileObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){const label=sectionLabelMap[entry.target.id];if(label)$('#sectionName').textContent=arabic?(translations[label]||label):label;}}),{rootMargin:'-25% 0px -60% 0px'});
  ['profile'].forEach(id=>profileObserver.observe($('#'+id)));
})();
