const formatRoleLine = (role) => {
  if (!role) return 'Je bent ingelogd.'
  if (role === 'admin') return 'Je bent ingelogd als beheerder.'
  if (role === 'co-admin') return 'Je bent ingelogd als co-admin.'
  if (role === 'editor' || role === 'co-editor') return 'Je bent ingelogd als co-editor.'
  return 'Je hebt kijkrechten (viewer).'
}

export default function createAdminTutorialSteps(name = 'Gast', role = '') {
  return [
    {
      title: `Welkom ${name}`,
      text: `${formatRoleLine(role)} Deze rondleiding laat zien waar je kamerinstellingen, uitnodigingen en het wisselen van kamers vindt.`,
    },
    {
      title: 'Gebruikersrollen',
      text: 'Zo werken de rollen in deze demo:',
      selector: '#profile-menu-admin-settings',
      bullets: [
        {
          title: 'Admin',
          items: [
            'Creeert de kamer(s) en is hoofdbeheerder',
            'Kan objecten plaatsen en bewerken',
            'Kan een kamercode genereren om andere mensen uit te nodigen, en deze instellen als co-admin of co-editor',
          ],
        },
        {
          title: 'Co-admin',
          items: [
            'Helpt mee met het beheren van de kamer',
            'Kan instellingen en uitnodigingen mee opvolgen',
            'Kan niet de hoofdbeheerder vervangen',
          ],
        },
        {
          title: 'Co-editor',
          items: [
            'Kan de kamer bewerken en objecten plaatsen',
            'Helpt mee aan de inhoud van de ruimte',
            'Heeft geen beheerrechten voor alle instellingen',
          ],
        },
        {
          title: 'Viewer',
          items: [
            'Kan de kamer bekijken zonder te bewerken',
            'Heeft alleen lees- en kijktoegang',
            'Kan geen inhoud of instellingen aanpassen',
          ],
        },
      ],
    },
    {
      title: 'Open kamerinstellingen',
      text: 'Hier pas je privacy, uitnodigingen en leden van deze kamer aan.',
      selector: '#profile-menu-room-settings',
    },
    {
      title: 'Deel de kamersleutel',
      text: 'Met de code nodig je snel anderen uit voor deze kamer.',
      selector: '#room-code-button',
    },
    {
      title: 'Nodig iemand uit',
      text: 'Voeg een e-mailadres toe en kies welke rol die persoon krijgt.',
      selector: '#room-invite-row',
    },
    {
      title: 'Kies een rol',
      text: 'Co-admins kunnen ook beheren, co-editors helpen met de inhoud en viewers krijgen alleen kijktoegang.',
      selector: '#room-invite-role-select',
    },
    {
      title: 'Wissel van kamer',
      text: 'In Mijn ruimtes zie je de kamers waar jij toegang toe hebt. Zo spring je snel naar een andere ruimte.',
      selector: '#room-switcher-list',
    },
    {
      title: 'Sla je aanpassingen op',
      text: 'Als je klaar bent, sla je de kamerinstellingen hier op.',
      selector: '#room-settings-save',
    },
  ]
}
