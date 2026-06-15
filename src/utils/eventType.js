const getEventTypeWithArticle = (eventType) => {
  if (!eventType || !String(eventType).trim()) {
    return 'à notre événement';
  }

  const type = String(eventType).trim();

  switch (type) {
    case 'Mariage':
      return 'à notre mariage';
    case 'Anniversaire':
      return 'à mon anniversaire';
    case 'Baby Shower':
      return 'à notre baby shower';
    case 'Remise de diplôme':
      return 'à ma remise de diplôme';
    case 'Événement corporate':
      return 'à notre événement corporate';
    case 'Fête':
      return 'à notre fête';
    case 'Autre':
      return 'à notre événement';
    default:
      return `à notre ${type.toLowerCase()}`;
  }
};

module.exports = { getEventTypeWithArticle };
