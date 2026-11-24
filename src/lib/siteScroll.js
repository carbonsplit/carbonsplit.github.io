let activeScrollbar=null;
export const SCROLL_SETTINGS=Object.freeze({
  damping:.04,thumbMinSize:5,renderByPixels:true,alwaysShowTracks:false,continuousScrolling:true,
  plugins:{overscroll:{effect:'glow',damping:.01,maxOverscroll:30,glowColor:'#222a2d'}}
});
export function setSiteScrollbar(instance){activeScrollbar=instance;}
export function getPageScroll(){return activeScrollbar?.offset.y ?? window.scrollY;}
export function scrollPageTo(top,animated=false){
  if(activeScrollbar){activeScrollbar.setMomentum(0,0);activeScrollbar.scrollTo(0,top,animated?650:0);}
  else window.scrollTo({top,behavior:animated?'smooth':'instant'});
}
export function scrollToElement(element,animated=true,offset=72){
  if(element)scrollPageTo(getPageScroll()+element.getBoundingClientRect().top-offset,animated);
}
