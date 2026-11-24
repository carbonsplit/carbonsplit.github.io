import { useEffect, useRef } from 'react';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';
import { SCROLL_SETTINGS,setSiteScrollbar,scrollToElement } from '../lib/siteScroll';
import './SmoothScroll.css';
// oxlint-disable-next-line react-hooks/rules-of-hooks
Scrollbar.use(OverscrollPlugin);

export default function SmoothScroll({children}){
  const host=useRef(null);
  useEffect(()=>{
    const element=host.current;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    let instance=null,glow=null,track=null,overlayFrame=0;
    const enable=()=>{
      if(media.matches||instance)return;
      const position=window.scrollY;
      document.documentElement.classList.add('site-smooth-enabled');
      instance=Scrollbar.init(element,{
        ...SCROLL_SETTINGS,delegateTo:document,
        plugins:{overscroll:{...SCROLL_SETTINGS.plugins.overscroll}}
      });
      setSiteScrollbar(instance);
      if(import.meta.env.DEV)window.__SITE_SCROLL__=instance;
      // Fixed pit stage/header live outside the transformed scrolling content.
      // Move library-owned overlay elements to the viewport as well.
      overlayFrame=requestAnimationFrame(()=>{
        if(!instance)return;
        glow=element.querySelector(':scope > canvas');
        if(glow){glow.dataset.siteScrollGlow='';document.body.appendChild(glow);}
      });
      track=instance.track.yAxis.element;track.classList.add('site-scroll-track');document.body.appendChild(track);
      instance.setPosition(0,position);window.scrollTo({top:0,behavior:'instant'});
    };
    const disable=()=>{
      cancelAnimationFrame(overlayFrame);
      if(!instance)return;
      const position=instance.offset.y;
      if(track)element.appendChild(track);
      if(glow)element.appendChild(glow);
      instance.destroy();instance=null;track=null;glow=null;setSiteScrollbar(null);
      if(import.meta.env.DEV)delete window.__SITE_SCROLL__;
      document.documentElement.classList.remove('site-smooth-enabled');
      window.scrollTo({top:position,behavior:'instant'});
    };
    const change=()=>media.matches?disable():enable();
    const anchor=e=>{
      if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
      const link=e.target.closest?.('a[href^="#"]');if(!link||!instance)return;
      let id;try{id=decodeURIComponent(link.hash.slice(1));}catch{return;}
      const target=document.getElementById(id);if(!target)return;
      e.preventDefault();scrollToElement(target,true);history.pushState(null,'',link.hash);
      target.focus({preventScroll:true});
    };
    const hash=()=>{if(location.hash){let target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{return;}scrollToElement(target,false);}};
    const focus=e=>{if(instance&&element.contains(e.target)&&e.target.id!=='portfolio')instance.scrollIntoView(e.target,{onlyScrollIfNeeded:true,offsetTop:72,offsetBottom:20});};
    const key=e=>{
      if(!instance||e.defaultPrevented||element.contains(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.target.matches?.('input,textarea,select,[contenteditable="true"]'))return;
      if(e.code==='Space'&&e.target.closest?.('button,a'))return;
      const delta={ArrowDown:40,ArrowUp:-40,PageDown:innerHeight-40,PageUp:40-innerHeight,End:instance.limit.y-instance.offset.y,Home:-instance.offset.y,Space:e.shiftKey?-200:200}[e.code];
      if(delta!==undefined){e.preventDefault();instance.addMomentum(0,delta);}
    };
    enable();hash();media.addEventListener('change',change);
    document.addEventListener('click',anchor);document.addEventListener('focusin',focus);document.addEventListener('keydown',key);window.addEventListener('hashchange',hash);
    return()=>{media.removeEventListener('change',change);document.removeEventListener('click',anchor);document.removeEventListener('focusin',focus);document.removeEventListener('keydown',key);window.removeEventListener('hashchange',hash);disable();};
  },[]);
  return <div ref={host} className="site-scroll"><div className="site-scroll-page">{children}</div></div>;
}
