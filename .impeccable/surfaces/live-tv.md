# Landing-page Live TV extension

Mode: Operate inside the established landing page. Success: select and watch a public channel without leaving Sparkexchange. Add the section after the existing guide video; expose it in desktop/mobile navigation. Keep all existing landing sections and exchange flows intact.

Direction: inherit existing Inter typography, dark charcoal background/card tokens, gold primary, muted text and 12–16px control/shell corners. Use the site's 3xl/4xl section heading and text-lg introduction. Video + metadata on the right, a bounded channel browser on the left; below 900px video comes first, controls wrap, channel list remains bounded. Use bounded 100-channel pages with server-side search and private favorites queries. Existing SVG icon family for consistency. No custom illustration, provider webpage iframe or extra visual world.

States: lazy automatic catalog loading near viewport, error/retry, empty search/favorites, connecting, playing, stopped, failed public feed with honest recovery. HLS loads on selection or proximity-triggered muted autoplay; browser-native controls, keyboard names, reduced-motion scrolling, no autoplay at the top of the landing page; one muted start within 120px of the TV section. Selected feed, search/category/favorites and pagination work; AbortController and media cleanup prevent stale results.

Inspection limitations: no supported browser-control tool is exposed in this session. Code/DOM/network and build checks can verify structure and behavior; actual screenshots/device rendering cannot be certified.
