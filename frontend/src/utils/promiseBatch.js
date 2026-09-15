/* =====================================
   Custom Promise.all batching

   Maximum number of simultaneous tasks
   is controlled by batchSize.
   ===================================== */

export const promiseAllInBatches = async (
  tasks,
  batchSize = 3,
  onBatchComplete = () => {}
) => {
  const results = [];

  for (let start = 0;start < tasks.length;start += batchSize) {
    const batch = tasks.slice(
      start,
      start + batchSize
    );

    const batchResults =
      await Promise.all(
        batch.map((task) => task())
      );

    results.push(...batchResults);

    await onBatchComplete(batchResults);
  }

  return results;
};