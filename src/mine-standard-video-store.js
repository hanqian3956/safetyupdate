function videoRequest(mode, run) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("mine-standard-videos", 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true }).createIndex("page", "pageId");
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      try {
        const transaction = db.transaction("videos", mode);
        let result;
        transaction.oncomplete = () => { db.close(); resolve(result); };
        transaction.onabort = () => { db.close(); reject(transaction.error); };
        const operation = run(transaction.objectStore("videos"));
        operation.onsuccess = () => { result = operation.result; };
      } catch (error) {
        db.close();
        reject(error);
      }
    };
  });
}

export const listStandardVideos = (pageId) => videoRequest("readonly", (store) => store.index("page").getAll(pageId));
export const addStandardVideo = (record) => videoRequest("readwrite", (store) => store.add(record));
export const removeStandardVideo = (id) => videoRequest("readwrite", (store) => store.delete(id));
