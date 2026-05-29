const formatRoleLine = (role) => {
  if (!role) return 'Je bent ingelogd.'
  if (role === 'admin') return 'Je bent ingelogd als beheerder.'
  // co-admin role removed; fall through to other role labels
  if (role === 'editor' || role === 'co-editor') return 'Je bent ingelogd als co-editor.'
  return 'Je hebt kijkrechten (viewer).'
}

export default function createAdminTutorialSteps(name = 'Gast', role = '') {
  return [
    {
      title: `Welkom ${name}`,
      text: `${formatRoleLine(role)} Deze rondleiding laat zien waar je kamerinstellingen, uitnodigingen en het wisselen van kamers vindt.`,
      panelPlacement: 'center',
      showSpotlight: false,
    },
    {
      title: 'Gebruikersrollen',
      text: 'Er zijn vier soorten gebruikers, hieronder word uitgelegd hoe ze werken.',
      subtext: 'Specifieke gebruikersinstellingen vind je in het dropdownmenu bij je profiel.',
      selectors: ['.profile-area', '.profile-menu'],
      panelPlacement: 'left-of-target',
      openProfileMenu: true,
      pinProfileMenuOpen: true,
      bullets: [
        {
          title: 'Admin',
          items: [
            'Creeert de kamer(s) en is hoofdbeheerder',
            'Kan objecten plaatsen en bewerken',
            'Kan een kamercode genereren om andere mensen uit te nodigen en deze instellen als co-editor',
          ],
        },
        // co-admin role removed from tutorial
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
      title: 'Beheerdersinstellingen',
      text: 'Hier zie je het hoofdscherm voor je account- en kamerinstellingen.',
      selector: '#admin-settings-modal-title',
      panelPlacement: 'top-right',
      compactPanel: true,
      compactPanelMaxHeight: 220,
      panelOffsetY: 28,
      spotlightScale: 0.28,
      spotlightOffset: { x: -60, y: 68 },
      openAdminSettingsModal: true,
      showSpotlight: true,
    },
    {
      title: 'Kamerinstellingen',
      text: 'Hier beheer je je profiel en kamers. Belangrijke acties staan hieronder in één overzicht.',
      selector: '#room-settings-modal-card',
      panelPlacement: 'top-right',
      compactPanel: true,
      compactPanelMaxHeight: 320,
      panelOffsetY: 20,
      spotlightScale: 0.34,
      spotlightOffset: { x: -80, y: 100 },
      openRoomSettingsModal: true,
      closeAdminSettingsModal: true,
      showSpotlight: true,
      bullets: [
        {
          title: 'Belangrijk in deze modal',
          items: [
            'Profielblok: je e-mail en rol.',
            'Display name: wijzig je zichtbare naam.',
            'Mijn ruimtes: open, wissel of maak kamers.',
            'Deel de kamersleutel: genereer en kopieer een uitnodigingscode.',
            'Nodig iemand uit: voeg e-mail en rol toe.',
            'Kies een rol: bepaal permissies (admin/co-editor/viewer).',
            'Opslaan: sla je wijzigingen op of annuleer.',
          ],
        },
      ],
    },
    {
      title: 'Editorgebied',
      text: 'Dit is het hoofdgebied waar je je kamer bewerkt en objecten plaatst.',
      selector: '.scene-canvas',
      panelPlacement: 'left-of-target',
      panelMinHeight: 180,
      panelOffsetX: 0,
      spotlightScale: 0.74,
      spotlightOffset: { x: 0, y: 0 },
      closeAdminSettingsModal: true,
      showSpotlight: true,
    },
    {
      title: 'Assets-paneel',
      text: 'Hier vind je je beschikbare assets (ruimtes, modellen, media).',
      selector: '#asset-panel',
      panelPlacement: 'right-of-target',
      panelMinHeight: 180,
      spotlightScale: 0.7,
      showSpotlight: true,
    },
    {
      title: 'Opslaan & Versies',
      text: 'Gebruik Opslaan om wijzigingen te bewaren en Versies om eerdere versies te herstellen of te verwijderen.',
      selectors: ['#scene-storage-dock .storage-dock-button:nth-child(1)', '#scene-storage-dock .storage-dock-button:nth-child(2)'],
      panelPlacement: 'top-of-target',
      panelMinHeight: 180,
      showSpotlight: true,
    },
  ]
}
