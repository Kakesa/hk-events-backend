exports.getEventEndDateTime = (event) => {
  if (!event.date || !event.endTime) return null;

  const [hours, minutes] = event.endTime.split(":").map(Number);

  const endDate = new Date(event.date);
  endDate.setHours(hours, minutes, 0, 0);

  return endDate;
};
