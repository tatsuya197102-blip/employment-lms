'use client';
// =============================================================
// [KEISOKU_V1] 計測の部品(hr.globalworkforce.jp 用)。src/app/layout.tsx に1回だけ置く。
//   計測を入れるのは TOP(/)・/lp・/contact だけ。受講画面(/learn 以下)や管理画面には入れない。
//   1. Meta(Facebook)の計測タグ と GA4(Googleの解析) を読み込む(番号は lib/keisoku-config.ts)
//   2. ページが切り替わるたびに「ページを見た」を両方へ送る
//   3. 押されたリンクを見て送る:
//        mailto: の問い合わせ → Meta「Contact」/ GA4「contact_click」
//        Google Play / App Store → Meta「StoreClick」/ GA4「store_click」
//   4. ストアのリンクに「どこから来たか」を付ける
//        Google Play → &referrer=utm_source=...   App Store → ?pt=...&ct=...&mt=8
// =============================================================
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { KEISOKU } from '@/lib/keisoku-config';

type AnyFn = (...args: unknown[]) => void;
declare global {
  interface Window { fbq?: AnyFn; gtag?: AnyFn; dataLayer?: unknown[] }
}

const META = KEISOKU.metaPixelId;
const GA = KEISOKU.gaId;
const PT = KEISOKU.applePt;

function clean(s: string | null | undefined): string {
  return String(s || '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 40);
}
function snake(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}
/** 自作の出来事を Meta と GA4 の両方に送る */
export function track(name: string, params: Record<string, unknown> = {}) {
  try { window.fbq?.('trackCustom', name, params); } catch { /* 無視 */ }
  try { if (GA) window.gtag?.('event', snake(name), params); } catch { /* 無視 */ }
}
/** 問い合わせ・申込が「完了」したとき(フォーム送信など)に呼ぶ */
export function trackLead(params: Record<string, unknown> = {}) {
  try { window.fbq?.('track', 'Lead', params); } catch { /* 無視 */ }
  try { if (GA) window.gtag?.('event', 'generate_lead', params); } catch { /* 無視 */ }
}

/** このサイトは日本語だけ */
function langOf(_pathname: string): string {
  return 'ja';
}
function pageOf(pathname: string): string {
  if (pathname === '/') return 'top';
  if (pathname.startsWith('/lp')) return 'lp';
  if (pathname.startsWith('/contact')) return 'contact';
  return pathname.replace(/^\//, '').replace(/\//g, '_');
}
/** 計測を入れるページかどうか */
function isTarget(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/lp') || pathname.startsWith('/contact');
}

export default function Keisoku() {
  const pathname = usePathname() || '/';
  const first = useRef(true);
  const on = isTarget(pathname);

  // 2. ページが切り替わるたびに「見た」を送る(最初の1回は読み込み時の分で済んでいる)
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!on) return;
    try { window.fbq?.('track', 'PageView'); } catch { /* 無視 */ }
    try { if (GA) window.gtag?.('event', 'page_view', { page_path: pathname }); } catch { /* 無視 */ }
  }, [pathname, on]);

  // 4. ストアのリンクに印を付ける(ページが切り替わるたびに付け直す)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const lang = langOf(pathname);
    const utm = {
      utm_source: clean(q.get('utm_source')) || clean(q.get('from')) || 'lp',
      utm_medium: clean(q.get('utm_medium')) || 'lp',
      utm_campaign: clean(q.get('utm_campaign')) || `lp_${pageOf(pathname)}`,
      utm_content: clean(q.get('utm_content')) || lang,
    };
    const refStr = Object.entries(utm).map(([k, v]) => `${k}=${v}`).join('&');
    const ct = `${utm.utm_campaign}_${utm.utm_content}`.slice(0, 40);
    document.querySelectorAll<HTMLAnchorElement>('a[href*="play.google.com"]').forEach((a) => {
      const h = a.getAttribute('href') || '';
      a.href = h.split('&referrer=')[0] + '&referrer=' + encodeURIComponent(refStr);
    });
    document.querySelectorAll<HTMLAnchorElement>('a[href*="apps.apple.com"]').forEach((a) => {
      try {
        const u = new URL(a.getAttribute('href') || '');
        if (PT) u.searchParams.set('pt', PT);
        u.searchParams.set('ct', ct);
        u.searchParams.set('mt', '8');
        a.href = u.toString();
      } catch { /* 無視 */ }
    });
  }, [pathname]);

  // 3. 押されたリンクを見て送る(ページ全体で1つだけ監視)
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement | null;
      const a = t?.closest?.('a') as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const lang = langOf(pathname);
      const page = pageOf(pathname);
      if (href.startsWith('mailto:')) {
        try { window.fbq?.('track', 'Contact', { page, lang }); } catch { /* 無視 */ }
        track('ContactClick', { page, lang, kind: 'mail' });
        return;
      }
      if (href.includes('play.google.com') || href.includes('apps.apple.com')) {
        const kind = href.includes('apps.apple.com') ? 'apple' : 'play';
        track('StoreClick', { app: 'hrlms', kind, page, lang });
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname]);

  if (!on) return null;
  if (!META && !GA) return null;
  return (
    <>
      {META ? (
        <>
          <Script id="keisoku-meta" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META}');fbq('track','PageView');`}</Script>
          <noscript>
            <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${META}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      ) : null}
      {GA ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="keisoku-ga" strategy="afterInteractive">{`
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('js',new Date());gtag('config','${GA}',{anonymize_ip:true});`}</Script>
        </>
      ) : null}
    </>
  );
}
