// Minimal service worker: makes the app installable as a real PWA on Android
// and lets it keep working with no connection after the first visit.

var CACHE_NAME = "poopal-cache-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.addAll(ASSETS); })
      .catch(function(){ /* fine if an asset name differs; fetch handler still works */ })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Cache-first, falling back to network, falling back to whatever's cached if offline.
self.addEventListener("fetch", function(event){
  event.respondWith(
    caches.match(event.request).then(function(cached){
      var fetchPromise = fetch(event.request).then(function(response){
        if (response && response.ok){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
