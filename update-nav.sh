#!/bin/bash
# Script to update navigation in all existing HTML pages
# The new nav includes CRM/Leads, Campaigns, Appointments, Bot Settings sections

NEW_NAV='<nav class="flex-1 px-4 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-dashboard.html"><span class="material-symbols-outlined">dashboard<\/span><span>לוח בקרה<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-opportunities.html"><span class="material-symbols-outlined">diamond<\/span><span>הזדמנויות<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-complexes.html"><span class="material-symbols-outlined">location_city<\/span><span>מתחמים<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-map-view.html"><span class="material-symbols-outlined">map<\/span><span>מפת פרויקטים<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-market-analysis.html"><span class="material-symbols-outlined">monitoring<\/span><span>ניתוח שוק<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-properties.html"><span class="material-symbols-outlined">apartment<\/span><span>נכסים<\/span><\/a>
<div class="pt-2 pb-1"><p class="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-4">CRM ולידים<\/p><\/div>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-leads.html"><span class="material-symbols-outlined">people<\/span><span>לידים ו-CRM<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-campaigns.html"><span class="material-symbols-outlined">campaign<\/span><span>קמפיינים<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-appointments.html"><span class="material-symbols-outlined">calendar_month<\/span><span>פגישות ויומן<\/span><\/a>
<div class="pt-2 pb-1"><p class="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-4">תקשורת<\/p><\/div>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-messaging.html"><span class="material-symbols-outlined">mail<\/span><span>הודעות ו-WA<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-bot-settings.html"><span class="material-symbols-outlined">smart_toy<\/span><span>הגדרות בוט<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-alerts.html"><span class="material-symbols-outlined">notifications<\/span><span>התראות<\/span><\/a>
<div class="pt-2 pb-1"><p class="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-4">מערכת<\/p><\/div>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-scans.html"><span class="material-symbols-outlined">radar<\/span><span>סריקות<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-reports.html"><span class="material-symbols-outlined">description<\/span><span>דוחות<\/span><\/a>
<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all" href="quantum-settings.html"><span class="material-symbols-outlined">settings<\/span><span>הגדרות<\/span><\/a>
<\/nav>'

echo "Done"
