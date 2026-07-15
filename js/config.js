const firebaseConfig = {
    apiKey: "AIzaSyADYzUm8ho6fhqtIAbHNL0B2AM6AxI34JU",
    authDomain: "transaksiku-387f7.firebaseapp.com",
    projectId: "transaksiku-387f7",
    storageBucket: "transaksiku-387f7.firebasestorage.app",
    messagingSenderId: "381040753319",
    appId: "1:381040753319:web:80ba1d8d89298d32bb3982"
};

let auth;
let db;

if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) {
        console.error("Firebase init failed:", e);
        auth = {
            onAuthStateChanged: (cb) => cb(null),
            currentUser: null
        };
        db = {
            collection: () => ({
                doc: () => ({
                    get: async () => ({ exists: false }),
                    set: async () => {},
                    onSnapshot: () => () => {}
                })
            })
        };
    }
} else {
    console.warn("Firebase SDK not loaded. Running in local/offline fallback mode.");
    auth = {
        onAuthStateChanged: (cb) => cb(null),
        currentUser: null
    };
    db = {
        collection: () => ({
            doc: () => ({
                get: async () => ({ exists: false }),
                set: async () => {},
                onSnapshot: () => () => {}
            })
        })
    };
}
