// create a new db
let db;

const request = indexedDB.open("budget", 1);

// create object store called "pending" and set autoIncrement to true
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("Woops! " + event.target.errorCode);
};

// create a transaction on the pending db with readwrite access and storing it
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");

  const store = transaction.objectStore("pending");

  store.add(record);
}

// open a transaction on your pending db
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");

  const store = transaction.objectStore("pending");

  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          const transaction = db.transaction(["pending"], "readwrite");

          // access your pending object store
          const store = transaction.objectStore("pending");

          // clear all items in your store
          store.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);