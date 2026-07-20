export type Lang = "en" | "ar";

export const dict = {
  brandTag: { en: "Claims Recovery System", ar: "نظام استرجاع المطالبات" },
  newAppeal: { en: "+ New appeal", ar: "+ اعتراض جديد" },
  openDashboard: { en: "Revenue Command Center →", ar: "← مركز إدارة الإيرادات" },

  // dashboard
  dashTitle: { en: "Revenue Command Center", ar: "مركز إدارة الإيرادات" },
  dashSub: {
    en: "Every claim, from denial to recovery — one live view.",
    ar: "كل مطالبة، من الرفض إلى الاسترجاع — في شاشة واحدة.",
  },
  overdue: { en: "overdue", ar: "متأخرة" },
  dueSoon: { en: "due soon", ar: "قريبة الاستحقاق" },

  kAtRisk: { en: "At risk", ar: "معرّضة للخسارة" },
  kAtRiskNote: { en: "Denied + under appeal", ar: "مرفوضة + قيد الاعتراض" },
  kRecovered: { en: "Recovered", ar: "تم استرجاعها" },
  kRecoveredNote: { en: "Won back via appeals", ar: "استُرجعت عبر الاعتراضات" },
  kUnderpaid: { en: "Underpaid", ar: "مدفوعة ناقصة" },
  kUnderpaidNote: { en: "Paid below contract", ar: "مدفوعة أقل من العقد" },
  kDenialRate: { en: "Denial rate", ar: "نسبة الرفض" },
  kClaims: { en: "claims", ar: "مطالبة" },
  kWinRate: { en: "Appeal win rate", ar: "نسبة نجاح الاعتراض" },
  kWinNote: { en: "Of resolved appeals", ar: "من الاعتراضات المنجزة" },

  pDeadlines: { en: "Appeal deadlines", ar: "مواعيد الاعتراض النهائية" },
  pDeadlinesSub: {
    en: "Miss one and the money is gone for good",
    ar: "تفويت أي موعد يعني خسارة المبلغ نهائياً",
  },
  pReasons: { en: "Why claims are denied", ar: "أسباب رفض المطالبات" },
  pReasonsSub: { en: "Fix the top reason, stop repeat losses", ar: "عالج السبب الأول لتوقف الخسائر المتكررة" },
  pPayers: { en: "Payer scorecard", ar: "تقييم شركات التأمين" },
  pPayersSub: { en: "Who denies most and underpays most", ar: "الأكثر رفضاً ودفعاً ناقصاً" },
  pUnder: { en: "Underpayments", ar: "المدفوعات الناقصة" },
  pUnderSub: {
    en: "Payer paid below the contracted rate — quiet losses",
    ar: "دفعت الشركة أقل من السعر المتعاقد عليه — خسائر صامتة",
  },

  cClaim: { en: "Claim", ar: "المطالبة" },
  cPayer: { en: "Payer", ar: "الشركة" },
  cAmount: { en: "Amount", ar: "المبلغ" },
  cDaysLeft: { en: "Days left", ar: "الأيام المتبقية" },
  cDenialPct: { en: "Denial %", ar: "نسبة الرفض" },
  cAtRisk: { en: "At risk", ar: "معرّضة" },
  cUnderpaid: { en: "Underpaid", ar: "ناقصة" },
  cContracted: { en: "Contracted", ar: "المتعاقد" },
  cPaid: { en: "Paid", ar: "المدفوع" },
  cShortfall: { en: "Shortfall", ar: "الفرق" },
  dOverdue: { en: "overdue", ar: "متأخرة" },
  dDay: { en: "d", ar: "ي" },

  footer: {
    en: "Runs entirely on local, in-Kingdom infrastructure — no patient data leaves the Kingdom (PDPL compliant). Demo data is synthetic.",
    ar: "يعمل بالكامل على بنية محلية داخل المملكة — لا تغادر أي بيانات مرضى المملكة (متوافق مع نظام حماية البيانات). البيانات المعروضة تجريبية.",
  },

  // appeal page
  appealTitle: { en: "Appeal a denied claim", ar: "اعترض على مطالبة مرفوضة" },
  appealSub: {
    en: "Paste the denial letter — Arabic or English — and Radd drafts a review-ready appeal, cites the policy, and lists the evidence to attach. You approve before anything is sent.",
    ar: "الصق خطاب الرفض — بالعربية أو الإنجليزية — ويكتب رد مسودة اعتراض جاهزة للمراجعة، يستشهد بالوثيقة، ويحدد المستندات المطلوب إرفاقها. أنت توافق قبل الإرسال.",
  },
  placeholder: {
    en: "Paste the denial letter text here (English or Arabic)…",
    ar: "الصق نص خطاب الرفض هنا (عربي أو إنجليزي)…",
  },
  localHint: { en: "Runs locally · no data leaves the Kingdom", ar: "يعمل محلياً · لا تغادر البيانات المملكة" },
  generate: { en: "Generate appeal", ar: "إنشاء الاعتراض" },
  analyzing: { en: "Analyzing…", ar: "جارٍ التحليل…" },
  analysis: { en: "Analysis", ar: "التحليل" },
  strategy: { en: "Strategy", ar: "الاستراتيجية" },
  appealable: { en: "appealable", ar: "قابلة للاعتراض" },
  fixResubmit: { en: "fix & resubmit", ar: "تصحيح وإعادة إرسال" },
  noCode: { en: "no code", ar: "بدون رمز" },
  checklist: { en: "Attachment checklist", ar: "قائمة المرفقات" },
} as const;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  return dict[key][lang];
}

/** Currency formatting, locale-aware. */
export function money(n: number, lang: Lang): string {
  const num = n.toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
  return lang === "ar" ? `${num} ر.س` : `SAR ${num}`;
}
