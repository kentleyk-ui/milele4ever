export type Language = 'en' | 'fr'

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Landing page
    'landing.title': 'Milele',
    'landing.subtitle': 'Create meaningful digital memorials to celebrate and remember loved ones',
    'landing.cta': 'Create Memorial',
    'landing.login': 'Sign In',
    'landing.features': 'Features',
    'landing.about': 'About',
    'landing.contact': 'Contact',
    
    // Hero section
    'hero.heading': 'Milele means "forever" in Swahili.',
    'hero.paragraph1': 'Everyone is master of their life. We shape it in our image, with the tools and choices we hold dear, to leave behind the legacy we truly wish to pass on.',
    'hero.paragraph2': 'At Milele, we honor this profound freedom. Our mission is to watch over the legacy you have chosen: to secure it with the greatest care, to preserve it over time and ensure its continuity, so that it soars serenely into eternity.',
    'hero.closing': 'Milele — Because what truly matters must last forever.',
    'hero.button': 'Get Started',
    'hero.explore': 'Explore Memorials',
    'hero.feature1': 'Your Legacy',
    'hero.feature1Desc': 'Secure and shape the heritage you wish to leave behind',
    'hero.feature2': 'Preserved Forever',
    'hero.feature2Desc': 'Ensure your memory soars serenely into eternity',
    'hero.feature3': 'Complete Control',
    'hero.feature3Desc': 'Make choices that reflect your deepest values',
    
    // Services preview
    'services.heading': 'All Services in One Place',
    'services.description': 'Easily find and contact all essential providers during this difficult time. For humans and pets alike.',
    'services.funeralHome': 'Funeral Homes',
    'services.funeralHomeDesc': 'Funeral homes and crematoriums',
    'services.florists': 'Florists',
    'services.floristsDesc': 'Floral arrangements and wreaths',
    'services.caterers': 'Caterers',
    'services.caterersDesc': 'Receptions and memorial meals',
    'services.notaries': 'Notaries',
    'services.notariesDesc': 'Legal services and succession',
    'services.transport': 'Transport',
    'services.transportDesc': 'Funeral transport services',
    'services.pets': 'Our Furry Friends',
    'services.petsDesc': 'Funeral services for pets',
    
    // Footer
    'footer.tagline': 'Forever in our hearts. With respect and dignity.',
    'footer.copyright': 'Product Owner - Kent Ley_CEO © {year} Milele. All rights reserved.',
    
    // Auth
    'auth.login': 'Sign In',
    'auth.signup': 'Create Account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.fullName': 'Full Name',
    'auth.signin': 'Sign In',
    'auth.create': 'Create Account',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.error': 'Error signing in. Please check your credentials.',
    'auth.success': 'Welcome! Check your email to confirm your account.',
    
    // App
    'app.feed': 'Feed',
    'app.memorials': 'Memorials',
    'app.messages': 'Messages',
    'app.notifications': 'Notifications',
    'app.services': 'Services',
    'app.gallery': 'Gallery',
    'app.timeline': 'Timeline',
    'app.family': 'Family',
    'app.welcome': 'Welcome to Milele',
    'app.recentMemorials': 'Recent Memorials',
    'app.noMessages': 'No messages yet',
    'app.noNotifications': 'You are all caught up',
    
    // Pets
    'pets.title': 'Our Friends',
    'pets.subtitle': 'Meet the team behind Milele',
    'pets.name': 'Sultan',
    'pets.role': 'Chief Relaxation Officer',
    'pets.bio': 'A loyal companion who believes in the importance of rest and reflection.',
    
    // Feedback
    'feedback.title': 'Suggestions',
    'feedback.subtitle': 'Your ideas help us improve Milele',
    'feedback.name': 'Your name (optional)',
    'feedback.namePlaceholder': 'Anonymous',
    'feedback.message': 'Your message',
    'feedback.messagePlaceholder': 'Share your ideas, suggestions or feedback...',
    'feedback.send': 'Send',
    'feedback.sent': 'Message sent!',
    'feedback.sentDesc': 'Thank you for your feedback.',
    'feedback.disclaimer': 'Your message will be sent to the Milele team.',
    'feedback.emailSubject': 'Suggestion - Milele',
    'feedback.emailFrom': 'From',
    'feedback.anonymous': 'Anonymous',

    // Common
    'common.back': 'Back',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success!',
  },
  fr: {
    // Landing page
    'landing.title': 'Milele',
    'landing.subtitle': 'Créez des mémoriaux numériques significatifs pour célébrer et honorer vos proches',
    'landing.cta': 'Créer un Mémorial',
    'landing.login': 'Se Connecter',
    'landing.features': 'Fonctionnalités',
    'landing.about': 'À Propos',
    'landing.contact': 'Contact',
    
    // Hero section
    'hero.heading': 'Milele signifie « pour toujours » en swahili.',
    'hero.paragraph1': 'Chacun est maître de sa vie. Nous la façonnons à notre image, avec les outils et les choix qui nous tiennent à cœur, pour laisser derrière nous l\'héritage que nous désirons vraiment transmettre.',
    'hero.paragraph2': 'Chez Milele, nous honorons cette liberté profonde. Notre mission est de veiller sur cet héritage que vous avez choisi : le sécuriser avec le plus grand soin, le préserver dans le temps et assurer sa continuité, pour qu\'il s\'envole sereinement vers l\'éternité.',
    'hero.closing': 'Milele — Parce que ce qui compte vraiment doit durer pour toujours.',
    'hero.button': 'Commencer',
    'hero.explore': 'Explorer les Mémoriaux',
    'hero.feature1': 'Votre Héritage',
    'hero.feature1Desc': 'Sécurisez et façonnez l\'héritage que vous souhaitez transmettre',
    'hero.feature2': 'Préservé à Jamais',
    'hero.feature2Desc': 'Assurez-vous que votre mémoire s\'envole sereinement vers l\'éternité',
    'hero.feature3': 'Contrôle Total',
    'hero.feature3Desc': 'Faites des choix qui reflètent vos valeurs les plus profondes',
    
    // Services
    'services.title': 'Nos Services',
    'services.memorial': 'Mémorial Numérique',
    'services.memorialDesc': 'Créez un espace personnalisé pour célébrer une vie',
    'services.flowers': 'Fleurs Virtuelles',
    'services.flowersDesc': 'Envoyez des fleurs et des bougies virtuelles de commémoration',
    'services.photos': 'Galerie de Photos',
    'services.photosDesc': 'Partagez et organisez des photographies précieuses',
    'services.stories': 'Partager des Histoires',
    'services.storiesDesc': 'Laissez votre famille et vos amis partager leurs souvenirs',
    'services.timeline': 'Chronologie',
    'services.timelineDesc': 'Documentez les étapes importantes de la vie',
    'services.family': 'Arbre Généalogique',
    'services.familyDesc': 'Connectez et honorez les relations familiales',
    
    // Services preview
    'services.heading': 'Tous les Services au Même Endroit',
    'services.description': 'Trouvez et contactez facilement tous les prestataires essentiels lors de cette période difficile. Pour les humains comme pour les animaux de compagnie.',
    'services.funeralHome': 'Salons Funéraires',
    'services.funeralHomeDesc': 'Maisons funéraires et crématoriums',
    'services.florists': 'Fleuristes',
    'services.floristsDesc': 'Arrangements floraux et couronnes',
    'services.caterers': 'Traiteurs',
    'services.caterersDesc': 'Réceptions et repas commémoratifs',
    'services.notaries': 'Notaires',
    'services.notariesDesc': 'Services juridiques et succession',
    'services.transport': 'Transport',
    'services.transportDesc': 'Services de transport funéraire',
    'services.pets': 'Pour nos Amis Poilus',
    'services.petsDesc': 'Services funéraires pour animaux',
    
    // Footer
    'footer.tagline': 'Pour toujours dans nos cœurs. Avec respect et dignité.',
    'footer.copyright': 'Product Owner - Kent Ley_CEO © {year} Milele. Tous droits réservés.',
    
    // Auth
    'auth.login': 'Se Connecter',
    'auth.signup': 'Créer un Compte',
    'auth.email': 'Email',
    'auth.password': 'Mot de Passe',
    'auth.confirmPassword': 'Confirmer le Mot de Passe',
    'auth.fullName': 'Nom Complet',
    'auth.signin': 'Se Connecter',
    'auth.create': 'Créer un Compte',
    'auth.noAccount': "Vous n'avez pas de compte?",
    'auth.haveAccount': 'Vous avez déjà un compte?',
    'auth.error': 'Erreur de connexion. Veuillez vérifier vos identifiants.',
    'auth.success': 'Bienvenue! Vérifiez votre email pour confirmer votre compte.',
    
    // App
    'app.feed': 'Fil d\'actualité',
    'app.memorials': 'Mémoriaux',
    'app.messages': 'Messages',
    'app.notifications': 'Notifications',
    'app.services': 'Services',
    'app.gallery': 'Galerie',
    'app.timeline': 'Chronologie',
    'app.family': 'Famille',
    'app.welcome': 'Bienvenue sur Milele',
    'app.recentMemorials': 'Mémoriaux Récents',
    'app.noMessages': 'Pas de messages encore',
    'app.noNotifications': 'Vous êtes à jour',
    
    // Pets
    'pets.title': 'Nos Amis',
    'pets.subtitle': 'Rencontrez l\'équipe derrière Milele',
    'pets.name': 'Sultan',
    'pets.role': 'Directeur de la Détente',
    'pets.bio': 'Un compagnon loyal qui croit en l\'importance du repos et de la réflexion.',
    
    // Feedback
    'feedback.title': 'Suggestions',
    'feedback.subtitle': 'Vos idées nous aident à améliorer Milele',
    'feedback.name': 'Votre nom (optionnel)',
    'feedback.namePlaceholder': 'Anonyme',
    'feedback.message': 'Votre message',
    'feedback.messagePlaceholder': 'Partagez vos idées, suggestions ou commentaires...',
    'feedback.send': 'Envoyer',
    'feedback.sent': 'Message envoyé!',
    'feedback.sentDesc': 'Merci pour votre retour.',
    'feedback.disclaimer': 'Votre message sera envoyé à l\'équipe Milele.',
    'feedback.emailSubject': 'Suggestion - Milele',
    'feedback.emailFrom': 'De la part de',
    'feedback.anonymous': 'Anonyme',

    // Common
    'common.back': 'Retour',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',
    'common.success': 'Succès!',
  },
}

export function getTranslation(language: Language, key: string, defaultValue = key): string {
  return translations[language]?.[key] ?? defaultValue
}
