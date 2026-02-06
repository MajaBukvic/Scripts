// ==UserScript==
// @name         Ajuda Locale Selector
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Auto-select target locales for translation batches
// @author       MajaBukvic
// @match        https://ajuda.a2z.com/*
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_NAME = 'Ajuda Locale Selector';
    const SCRIPT_VERSION = '2.2';
    let isInitialized = false;

    // ========================================
    // ALL AVAILABLE LOCALES
    // ========================================

    const ALL_LOCALES = [
        'ar-AE', 'bn-IN', 'cs-CZ', 'da-DK', 'de-DE',
        'en-GB', 'es-ES', 'es-MX',
        'fr-BE', 'fr-CA', 'fr-FR', 'gu-IN', 'he-IL', 'hi-IN',
        'it-IT', 'ja-JP', 'kn-IN', 'ko-KR', 'ml-IN', 'mr-IN', 'ms-MY',
        'nl-BE', 'nl-NL', 'pl-PL', 'pt-BR', 'pt-PT', 'sv-SE',
        'ta-IN', 'te-IN', 'th-TH', 'tr-TR', 'vi-VN', 'zh-CN', 'zh-TW'
    ];

    // Common locale groups for quick selection
    const LOCALE_GROUPS = {
        'MENA': ['ar-AE'],
        'EU & UK': ['de-DE', 'es-ES', 'fr-FR', 'it-IT', 'nl-NL', 'pl-PL', 'sv-SE', 'nl-BE', 'fr-BE'],
        'Asia': ['ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'th-TH', 'vi-VN', 'ms-MY'],
        'India': ['hi-IN', 'bn-IN', 'ta-IN', 'te-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'gu-IN'],
        'Americas': ['es-MX', 'pt-BR', 'fr-CA'],
        'Chinese': ['zh-CN', 'zh-TW']
    };

    // ========================================
    // VERTICAL/FUNCTION SPECIFIC CONFIGURATIONS
    // ========================================

    const VERTICAL_CONFIGS = {
        TSI: {
            name: "Trust and Store Integrity (TSI)",
            functions: {
                KYC_EU: {
                    name: "Know Your Customer - EU (KYC-EU)",
                    layerLocales: {
                        'BE': ['fr-BE', 'nl-BE', 'zh-CN', 'ko-KR', 'zh-TW'],
                        'BR': ['pt-BR', 'zh-CN', 'ko-KR', 'zh-TW'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'DE': ['de-DE', 'da-DK', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'ES': ['es-ES', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'FR': ['fr-FR', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'IE': ['zh-CN'],
                        'IT': ['it-IT', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'JP': ['ja-JP'],
                        'NL': ['nl-NL', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'PL': ['pl-PL', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'SE': ['sv-SE', 'da-DK', 'ko-KR', 'zh-TW'],
                        'UK': ['ar-AE', 'da-DK', 'nl-NL', 'hi-IN', 'ko-KR', 'pt-BR', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN']
                    }
                },
                KYC_Denver: {
                    name: "KYC Denver",
                    layerLocales: {
                        'DE': ['de-DE', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'ES': ['es-ES', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'FR': ['fr-FR', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'IE': ['zh-CN'],
                        'IT': ['it-IT', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'PL': ['pl-PL', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'pl-PL', 'es-ES', 'zh-TW', 'zh-CN']
                    }
                },
                KYC_RoW: {
                    name: "RoW KYC",
                    layerLocales: {
                        'JP': ['ja-JP', 'zh-CN'],
                        'US': ['ja-JP', 'zh-CN']
                    }
                },
                SIV: {
                    name: "Seller Identity Verification (SIV)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN', 'zh-TW'],
                        'CA': ['ar-AE', 'es-MX', 'zh-CN'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'IN': ['zh-CN'],
                        'JP': ['ja-JP'],
                        'MX': ['ar-AE', 'es-ES', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SG': ['zh-CN', 'zh-TW'],
                        'TR': ['tr-TR', 'zh-CN'],
                        'US': ['ar-AE', 'da-DK', 'nl-BE', 'nl-NL', 'fr-BE', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'es-MX', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN']
                    }
                },
                VAT: {
                    name: "Value Added Tax (VAT)",
                    layerLocales: {
                        'AE': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'AU': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'BE': ['fr-BE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'BR': ['pt-BR', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'CA': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'DE': ['de-DE', 'nl-NL', 'fr-FR', 'it-IT', 'es-ES', 'sv-SE'],
                        'EG': ['ar-AE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'sv-SE'],
                        'ES': ['es-ES', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'sv-SE'],
                        'FR': ['fr-FR', 'nl-NL', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'IE': ['ar-AE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'es-ES', 'sv-SE', 'tr-TR'],
                        'IN': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'IT': ['it-IT', 'nl-NL', 'fr-FR', 'de-DE', 'es-ES', 'sv-SE'],
                        'JP': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'MX': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'NL': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'PL': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'SA': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'SE': ['sv-SE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES'],
                        'SG': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'TR': ['tr-TR', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'UK': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE'],
                        'US': ['nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'es-ES', 'sv-SE']
                    }
                },
                SAM: {
                    name: "Suspicious Activity Monitoring (SAM)",
                    layerLocales: {
                        'BE': ['ar-AE', 'nl-BE', 'nl-NL', 'fr-BE', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'BR': ['pt-BR', 'nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'CA': ['nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'DE': ['de-DE', 'ar-AE', 'nl-NL', 'fr-FR', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'ES': ['es-ES', 'ar-AE', 'nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'FR': ['fr-FR', 'ar-AE', 'nl-NL', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'IE': ['zh-CN'],
                        'IT': ['it-IT', 'ar-AE', 'nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'JP': ['ja-JP', 'nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'MX': ['es-MX', 'nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'NL': ['nl-NL', 'ar-AE', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'PL': ['pl-PL', 'ar-AE', 'nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'SE': ['sv-SE', 'ar-AE', 'nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'SG': ['nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'UK': ['ar-AE', 'nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'US': ['ar-AE', 'nl-NL', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-MX', 'sv-SE', 'ta-IN', 'th-TH', 'zh-TW', 'tr-TR', 'vi-VN', 'zh-CN'],
                        'ZA': ['zh-CN']
                    }
                },
                CR: {
                    name: "Catalog Risk (CR)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'tr-TR', 'zh-CN'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN'],
                        'ZA': ['zh-CN']
                    }
                },
                FP: {
                    name: "Fraud Prevention (FP)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'tr-TR', 'zh-CN'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN']
                    }
                },
                SAP: {
                    name: "Sales Abuse Prevention (SAP)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'tr-TR', 'zh-CN'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN'],
                        'ZA': ['zh-CN']
                    }
                },
                APA_Seller: {
                    name: "Amazon Pay APA Seller - MRI, Claims",
                    layerLocales: {
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'es-ES'],
                        'ES': ['es-ES'],
                        'FR': ['fr-FR'],
                        'IN': ['hi-IN'],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP'],
                        'UK': ['fr-FR', 'de-DE', 'it-IT', 'es-ES']
                    }
                },
                AE_Abuse: {
                    name: "Abuse Escalations (AE)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'tr-TR', 'zh-CN'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN']
                    }
                },
                MDRI: {
                    name: "Merchant Debt Recovery Investigation (MDRI)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'tr-TR', 'zh-CN'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN']
                    }
                },
                FDAP: {
                    name: "BFD - Funds Disbursement Appeal Process (FDAP)",
                    layerLocales: {
                        'AE': ['ar-AE', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'AU': ['pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'CA': ['pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'DE': ['de-DE', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'ES': ['es-ES', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'FR': ['fr-FR', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'IT': ['it-IT', 'ja-JP', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'JP': ['ja-JP', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'MX': ['es-MX', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'NL': ['nl-NL', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'PL': ['pl-PL', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'SA': ['ar-AE', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'SE': ['sv-SE', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'SG': ['pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'TR': ['tr-TR', 'pt-BR', 'zh-CN', 'zh-TW'],
                        'UK': ['ja-JP', 'pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'US': ['pt-BR', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'ZA': ['zh-CN']
                    }
                },
                IT_Trust: {
                    name: "BFD - Inventory Trust (IT)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['zh-CN'],
                        'DE': ['de-DE', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN'],
                        'IT': ['it-IT', 'zh-CN'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'zh-CN'],
                        'UK': ['zh-CN', 'zh-TW'],
                        'US': ['zh-CN', 'zh-TW'],
                        'ZA': ['zh-CN']
                    }
                },
                SLM_FIRE: {
                    name: "BFD - SLM Fraud ID Remediation & Enforcement (FIRE)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['zh-CN'],
                        'DE': ['de-DE', 'zh-CN'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'zh-CN'],
                        'FR': ['fr-FR', 'zh-CN'],
                        'IE': ['zh-CN'],
                        'IT': ['it-IT', 'zh-CN'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'zh-CN'],
                        'UK': ['zh-CN', 'zh-TW'],
                        'US': ['zh-CN', 'zh-TW'],
                        'ZA': ['zh-CN']
                    }
                },
                SLM_BAP: {
                    name: "BFD - SLM Bad Actors Prevention (BAP)",
                    layerLocales: {
                        'AE': ['ar-AE', 'pl-PL', 'pt-BR', 'zh-CN'],
                        'AU': ['pl-PL', 'pt-BR', 'zh-CN'],
                        'BE': ['ar-AE', 'nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'pl-PL', 'zh-CN'],
                        'CA': ['pl-PL', 'pt-BR', 'zh-CN'],
                        'DE': ['de-DE', 'pl-PL', 'pt-BR', 'zh-CN'],
                        'ES': ['es-ES', 'pl-PL', 'pt-BR', 'zh-CN'],
                        'FR': ['fr-FR', 'pl-PL', 'pt-BR', 'zh-CN'],
                        'IN': ['hi-IN', 'pl-PL', 'pt-BR', 'zh-CN'],
                        'IT': ['it-IT', 'pl-PL', 'pt-BR', 'zh-CN'],
                        'JP': ['ja-JP', 'pl-PL', 'pt-BR', 'zh-CN'],
                        'MX': ['es-MX', 'pl-PL', 'pt-BR', 'zh-CN'],
                        'NL': ['nl-NL', 'pl-PL', 'pt-BR', 'zh-CN'],
                        'PL': ['pl-PL', 'pt-BR', 'zh-CN'],
                        'SA': ['ar-AE', 'pl-PL', 'pt-BR'],
                        'SE': ['sv-SE', 'pl-PL', 'pt-BR', 'zh-CN'],
                        'SG': ['pl-PL', 'pt-BR', 'zh-CN'],
                        'TR': ['tr-TR', 'pl-PL', 'pt-BR'],
                        'UK': ['hi-IN', 'pl-PL', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'vi-VN', 'zh-CN'],
                        'US': ['nl-BE', 'fr-BE', 'hi-IN', 'pl-PL', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'vi-VN']
                    }
                },
                SLM_Dormancy: {
                    name: "BFD - SLM Dormancy",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['zh-CN'],
                        'DE': ['de-DE', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN'],
                        'IT': ['it-IT', 'zh-CN', 'zh-TW'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'zh-CN'],
                        'UK': ['zh-CN', 'zh-TW'],
                        'US': ['zh-CN', 'zh-TW'],
                        'ZA': ['zh-CN']
                    }
                },
                IPI: {
                    name: "BFD - In-Person Investigation (IPI)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'tr-TR', 'zh-CN'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-TW', 'zh-CN'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'IE': ['zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-TW', 'zh-CN'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-TW', 'vi-VN', 'zh-CN'],
                        'ZA': ['zh-CN']
                    }
                },
                VR: {
                    name: "Vendor Risk (VR)",
                    layerLocales: {
                        'US': ['ar-AE', 'nl-BE', 'nl-NL', 'fr-BE', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'es-MX', 'sv-SE', 'th-TH', 'tr-TR', 'vi-VN']
                    }
                },
                IPV: {
                    name: "In-Person Verification (IPV)",
                    layerLocales: {
                        'US': ['ar-AE', 'nl-BE', 'nl-NL', 'fr-BE', 'fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pl-PL', 'pt-BR', 'es-ES', 'es-MX', 'sv-SE', 'th-TH', 'tr-TR', 'vi-VN']
                    }
                },
                Buyer_EU_KYC_SAM_SCR: {
                    name: "Buyer: EU KYC, SAM, Screening (EU stores)",
                    layerLocales: {
                        'BE': ['nl-BE', 'nl-NL', 'fr-BE', 'fr-FR', 'de-DE', 'it-IT', 'pl-PL', 'es-ES', 'sv-SE'],
                        'DE': ['nl-BE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'pl-PL', 'es-ES', 'sv-SE'],
                        'ES': ['nl-BE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'pl-PL', 'es-ES', 'sv-SE'],
                        'FR': ['nl-BE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'pl-PL', 'es-ES', 'sv-SE'],
                        'IE': ['zh-CN'],
                        'IT': ['nl-BE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'pl-PL', 'es-ES', 'sv-SE'],
                        'NL': ['nl-BE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'pl-PL', 'es-ES', 'sv-SE'],
                        'PL': ['nl-BE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'pl-PL', 'es-ES', 'sv-SE'],
                        'SE': ['nl-BE', 'nl-NL', 'fr-FR', 'de-DE', 'it-IT', 'pl-PL', 'es-ES', 'sv-SE']
                    }
                },
                Buyer_SAM_BR: {
                    name: "Buyer: SAM (BR store)",
                    layerLocales: {
                        'BR': ['pt-BR', 'zh-CN'],
                        'IE': ['zh-CN']
                    }
                },
                TT: {
                    name: "Transaction Trust SUMMIT (TT)",
                    layerLocales: {
                        'AE': ['ar-AE'],
                        'AU': [],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['zh-CN'],
                        'DE': ['de-DE', 'zh-CN'],
                        'EG': ['ar-AE'],
                        'ES': ['es-ES', 'zh-CN'],
                        'FR': ['fr-FR', 'zh-CN'],
                        'IE': ['zh-CN'],
                        'IT': ['it-IT', 'zh-CN'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['zh-CN'],
                        'US': ['zh-CN'],
                        'ZA': ['zh-CN']
                    }
                }
            }
        },
        BRP: {
            name: "Buyer Risk Prevention (BRP)",
            functions: {
                BRI: {
                    name: "Buyer Risk Investigation (BRI)",
                    layerLocales: {
                        'AE': ['ar-AE'],
                        'AU': [],
                        'BE': ['nl-BE', 'fr-BE'],
                        'BR': ['pt-BR'],
                        'CA': ['fr-CA'],
                        'DE': ['de-DE', 'cs-CZ', 'da-DK', 'nl-NL', 'pl-PL', 'tr-TR'],
                        'EG': ['ar-AE'],
                        'FR': ['fr-FR'],
                        'IE': [],
                        'IN': ['hi-IN', 'bn-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'ta-IN', 'te-IN'],
                                                'IT': ['it-IT'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX'],
                        'NL': ['nl-NL'],
                        'PL': ['pl-PL'],
                        'SA': ['ar-AE'],
                        'SE': ['sv-SE'],
                        'SG': [],
                        'TR': ['tr-TR'],
                        'UK': [],
                        'US': ['ar-AE', 'de-DE', 'he-IL', 'ko-KR', 'pt-BR', 'zh-CN', 'es-ES', 'zh-TW'],
                        'ZA': []
                    }
                },
                BRI_GC: {
                    name: "BRI Gift Cards (GC)",
                    layerLocales: {
                        'AE': ['ar-AE'],
                        'AU': [],
                        'BE': ['nl-BE', 'fr-BE'],
                        'BR': ['pt-BR'],
                        'CA': ['fr-CA'],
                        'DE': ['de-DE', 'cs-CZ', 'da-DK', 'nl-NL', 'pl-PL', 'tr-TR'],
                        'EG': ['ar-AE'],
                        'FR': ['fr-FR'],
                        'IE': [],
                        'IN': ['hi-IN', 'bn-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'ta-IN', 'te-IN'],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX'],
                        'NL': ['nl-NL'],
                        'PL': ['pl-PL'],
                        'SA': ['ar-AE'],
                        'SE': ['sv-SE'],
                        'SG': [],
                        'TR': ['tr-TR'],
                        'UK': [],
                        'US': ['ar-AE', 'de-DE', 'he-IL', 'ko-KR', 'pt-BR', 'zh-CN', 'es-ES', 'zh-TW'],
                        'ZA': []
                    }
                },
                CB: {
                    name: "Chargebacks (CB)",
                    layerLocales: {
                        'AE': ['ar-AE'],
                        'AU': ['ar-AE'],
                        'BE': ['fr-BE'],
                        'BR': ['pt-BR'],
                        'CA': ['fr-CA'],
                        'DE': ['de-DE', 'cs-CZ', 'da-DK', 'nl-NL', 'pl-PL', 'tr-TR'],
                        'EG': ['ar-AE'],
                        'ES': ['es-ES', 'pt-BR'],
                        'FR': ['fr-FR'],
                        'IE': [],
                        'IN': ['hi-IN', 'bn-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'ta-IN', 'te-IN'],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX'],
                        'NL': ['nl-NL'],
                        'PL': ['pl-PL'],
                        'SA': ['ar-AE'],
                        'SE': ['sv-SE'],
                        'SG': [],
                        'TR': ['tr-TR'],
                        'UK': [],
                        'US': ['ar-AE', 'de-DE', 'he-IL', 'ko-KR', 'pt-BR', 'zh-CN', 'es-ES', 'zh-TW'],
                        'ZA': []
                    }
                },
                APA_Buyer: {
                    name: "Amazon Pay APA Buyer - BRI, CB, SVA",
                    layerLocales: {
                        'DE': ['de-DE', 'cs-CZ', 'da-DK', 'nl-NL', 'en-GB', 'pl-PL', 'tr-TR'],
                        'ES': ['es-ES', 'pt-BR'],
                        'FR': ['fr-FR'],
                        'IN': ['hi-IN', 'bn-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'ta-IN', 'te-IN'],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'UK': [],
                        'US': ['ar-AE', 'de-DE', 'he-IL', 'ko-KR', 'pt-BR', 'zh-CN', 'es-ES', 'zh-TW', 'tr-TR']
                    }
                },
                B2B: {
                    name: "Business to Business (B2B)",
                    layerLocales: {
                        'AU': [],
                        'CA': ['fr-CA'],
                        'DE': ['de-DE', 'cs-CZ', 'da-DK', 'nl-NL', 'en-GB', 'pl-PL', 'tr-TR'],
                        'ES': ['es-ES', 'pt-BR'],
                        'FR': ['fr-FR'],
                        'IN': ['hi-IN', 'bn-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'ta-IN', 'te-IN'],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX'],
                        'UK': ['en-GB'],
                        'US': ['ar-AE', 'de-DE', 'he-IL', 'ko-KR', 'pt-PT', 'zh-CN', 'es-ES', 'zh-TW']
                    }
                },
                ARI: {
                    name: "Abuse Risk Investigation (ARI)",
                    layerLocales: {
                        'AE': ['ar-AE'],
                        'AU': [],
                        'BE': ['nl-BE', 'fr-BE'],
                        'BR': ['pt-BR'],
                        'CA': [],
                        'DE': ['de-DE'],
                        'EG': ['ar-AE'],
                        'ES': ['es-ES'],
                        'FR': ['fr-FR'],
                        'IE': [],
                        'IN': [],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX'],
                        'NL': ['nl-NL'],
                        'PL': ['pl-PL'],
                        'SA': ['ar-AE'],
                        'SE': ['sv-SE'],
                        'SG': [],
                        'TR': ['tr-TR'],
                        'UK': [],
                        'US': [],
                        'ZA': []
                    }
                },
                ABV: {
                    name: "Amazon Business Verifications (ABV)",
                    layerLocales: {
                        'AU': [],
                        'CA': ['fr-CA'],
                        'DE': ['de-DE', 'cs-CZ', 'da-DK', 'nl-NL', 'en-GB', 'pl-PL', 'tr-TR'],
                        'ES': ['es-ES', 'pt-BR'],
                        'FR': ['fr-FR'],
                        'IN': ['hi-IN', 'bn-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'ta-IN', 'te-IN'],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX'],
                        'UK': ['en-GB'],
                        'US': ['ar-AE', 'de-DE', 'he-IL', 'ko-KR', 'pt-PT', 'zh-CN', 'es-ES', 'zh-TW']
                    }
                },
                AB_RAM: {
                    name: "Amazon Business Risk & Abuse Management (AB-RAM)",
                    layerLocales: {
                        'AU': [],
                        'CA': ['fr-CA'],
                        'DE': ['de-DE', 'cs-CZ', 'da-DK', 'nl-NL', 'en-GB', 'pl-PL', 'tr-TR'],
                        'ES': ['es-ES', 'pt-BR'],
                        'FR': ['fr-FR'],
                        'IN': ['hi-IN', 'bn-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'ta-IN', 'te-IN'],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX'],
                        'UK': ['en-GB'],
                        'US': ['ar-AE', 'de-DE', 'he-IL', 'ko-KR', 'pt-PT', 'zh-CN', 'es-ES', 'zh-TW']
                    }
                },
                EE: {
                    name: "Executive Escalations (EE)",
                    layerLocales: {
                        'AE': ['ar-AE'],
                        'AU': [],
                        'BR': ['pt-BR'],
                        'CA': [],
                        'DE': ['de-DE'],
                        'EG': ['ar-AE'],
                        'ES': ['es-ES'],
                        'FR': ['fr-FR'],
                        'IN': [],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP'],
                        'MX': ['es-MX'],
                        'NL': ['nl-NL'],
                        'PL': ['pl-PL'],
                        'SA': ['ar-AE'],
                        'SE': ['sv-SE'],
                        'SG': [],
                        'TR': ['tr-TR'],
                        'UK': [],
                        'US': []
                    }
                },
                AIT: {
                    name: "Account Integrity (AIT)",
                    layerLocales: {
                        'AE': ['ar-AE'],
                        'AU': [],
                        'BE': ['nl-BE', 'fr-BE'],
                        'BR': ['pt-BR'],
                        'CA': ['fr-CA'],
                        'DE': ['de-DE', 'cs-CZ', 'da-DK', 'nl-NL', 'pl-PL', 'tr-TR'],
                        'EG': ['ar-AE'],
                        'ES': ['es-ES', 'pt-BR'],
                        'FR': ['fr-FR'],
                        'IE': [],
                        'IN': ['hi-IN', 'bn-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'ta-IN', 'te-IN'],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX'],
                        'NL': ['nl-NL'],
                        'PL': ['pl-PL'],
                        'SA': ['ar-AE'],
                        'SE': ['sv-SE'],
                        'SG': [],
                        'TR': ['tr-TR'],
                        'UK': [],
                        'US': ['ar-AE', 'de-DE', 'he-IL', 'ko-KR', 'pt-BR', 'zh-CN', 'es-ES', 'zh-TW'],
                        'ZA': []
                    }
                }
            }
        },
        TSE_RISC: {
            name: "TSE - Regulatory Intelligence, Safety & Compliance (RISC)",
            functions: {
                PSC: {
                    name: "Product Safety and Compliance (PSC)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'ZA': []
                    }
                },
                SERSC: {
                    name: "Seller Enforcement for Regulatory & Safety Compliance (SERSC)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'ZA': []
                    }
                },
                RPSA: {
                    name: "Restricted Products Seller Appeals (RPSA)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'ZA': []
                    }
                },
                GCP: {
                    name: "Global Controversial Products (GCP)",
                    layerLocales: {
                        'BE': [],
                        'DE': [],
                        'ES': [],
                        'FR': [],
                        'IE': [],
                        'IT': [],
                        'NL': [],
                        'PL': [],
                        'SE': [],
                        'UK': []
                    }
                },
                SCP: {
                    name: "Sexual Content Policy (SCP)",
                    layerLocales: {
                        'BE': [],
                        'DE': [],
                        'ES': [],
                        'FR': [],
                        'IE': [],
                        'IT': [],
                        'NL': [],
                        'PL': [],
                        'SE': [],
                        'UK': []
                    }
                }
            }
        },
        TSE_SEPO: {
            name: "TSE - Selling Experience Partner Operations (SEPO)",
            functions: {
                RA: {
                    name: "Reported Abuse (RA)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'ZA': []
                    }
                },
                Claims_Seller: {
                    name: "A-to-z Guarantee Claims Seller-facing (Claims-Seller)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'ZA': []
                    }
                },
                Claims_Buyer: {
                    name: "A-to-z Guarantee Claims Buyer-facing (Claims-Buyer)",
                    layerLocales: {
                        'AE': ['ar-AE'],
                        'AU': [],
                        'BE': ['nl-BE', 'fr-BE'],
                        'BR': ['pt-BR'],
                        'CA': [],
                        'DE': ['de-DE'],
                        'EG': ['ar-AE'],
                        'ES': ['es-ES'],
                        'FR': ['fr-FR'],
                        'IN': [],
                        'IT': ['it-IT'],
                        'JP': ['ja-JP'],
                        'MX': ['es-MX'],
                        'NL': ['nl-NL'],
                        'PL': ['pl-PL'],
                        'SA': ['ar-AE'],
                        'SE': ['sv-SE'],
                        'SG': [],
                        'TR': ['tr-TR'],
                        'UK': [],
                        'US': [],
                        'ZA': []
                    }
                },
                SAFET: {
                    name: "SAFE-T",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': [],
                        'BR': ['pt-BR', 'zh-CN'],
                        'DE': ['de-DE', 'zh-CN'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'zh-CN'],
                        'FR': ['fr-FR', 'zh-CN'],
                        'IN': [],
                        'IT': ['it-IT', 'zh-CN'],
                        'JP': ['ja-JP', 'zh-CN'],
                        'MX': ['es-MX', 'zh-CN'],
                        'NL': ['nl-NL'],
                        'PL': ['pl-PL'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SG': [],
                        'TR': ['tr-TR', 'zh-CN'],
                        'UK': ['zh-CN'],
                        'US': ['zh-CN'],
                        'ZA': []
                    }
                },
                CERT: {
                    name: "Certification Team (CERT)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'ZA': []
                    }
                },
                PAT: {
                    name: "Product Authentication Team (PAT)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'ZA': []
                    }
                },
                PQ: {
                    name: "Product Quality (PQ)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'ZA': []
                    }
                },
                OP: {
                    name: "Order Performance (OP)",
                    layerLocales: {
                        'AE': ['ar-AE', 'zh-CN'],
                        'AU': ['zh-CN'],
                        'BE': ['nl-BE', 'fr-BE', 'zh-CN'],
                        'BR': ['pt-BR', 'zh-CN'],
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'EG': ['ar-AE', 'zh-CN'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'IE': ['zh-CN'],
                        'IN': ['hi-IN', 'ta-IN', 'zh-CN'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'JP': ['ja-JP', 'fr-FR', 'de-DE', 'it-IT', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'NL': ['nl-NL', 'zh-CN'],
                        'PL': ['pl-PL', 'zh-CN'],
                        'SA': ['ar-AE', 'zh-CN'],
                        'SE': ['sv-SE', 'zh-CN'],
                        'SG': ['zh-CN'],
                        'TR': ['tr-TR', 'de-DE', 'zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'ZA': []
                    }
                },
                HM: {
                    name: "Handmade (HM)",
                    layerLocales: {
                        'CA': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES', 'zh-CN'],
                        'DE': ['de-DE', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW', 'tr-TR'],
                        'ES': ['es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'],
                        'FR': ['fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'IT': ['it-IT', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'es-ES', 'zh-CN', 'zh-TW'],
                        'MX': ['es-MX', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'],
                        'SE': ['zh-CN'],
                        'TR': ['zh-CN'],
                        'UK': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN'],
                        'US': ['fr-FR', 'de-DE', 'hi-IN', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'es-ES', 'ta-IN', 'th-TH', 'zh-CN', 'zh-TW', 'vi-VN']
                    }
                }
            }
        }
    };

    // ========================================
    // STATE VARIABLES
    // ========================================

    let selectedVertical = null;
    let selectedFunction = null;
    let manualLayerLocaleSelections = {};
    let batchLayerLocaleSelections = {}; // NEW: For batch mode
    let isProcessing = false;
    let stopRequested = false;
    let modalObserver = null;
    let currentMode = 'auto'; // 'auto', 'manual', or 'batch'

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function extractLayerFromText(text) {
        const match = text.match(/Published\/([A-Z]{2})/);
        return match ? match[1] : null;
    }

    function simulateClick(element) {
        if (!element) {
            console.log('[Locale Selector] Element not found for click');
            return false;
        }
        const event = new MouseEvent('click', {
            view: unsafeWindow,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
        return true;
    }

    function getLocalesForLayer(layer) {
        if (currentMode === 'manual') {
            return manualLayerLocaleSelections[layer] || [];
        }
        if (currentMode === 'batch') {
            return batchLayerLocaleSelections[layer] || [];
        }
        if (!selectedFunction || !selectedFunction.layerLocales) {
            return [];
        }
        return selectedFunction.layerLocales[layer] || [];
    }

    function getUniqueLayers() {
        const layers = new Set();
        const rows = document.querySelectorAll('#publish-table tbody tr.target-row');

        rows.forEach(row => {
            const layerCell = row.querySelector('td:nth-child(4)');
            if (layerCell) {
                const layer = extractLayerFromText(layerCell.textContent.trim());
                if (layer) {
                    layers.add(layer);
                }
            }
        });

        return Array.from(layers).sort();
    }

    function saveManualSelectionsToStorage() {
        try {
            localStorage.setItem('localeSelector_manualSelections', JSON.stringify(manualLayerLocaleSelections));
        } catch (e) {
            console.error('[Locale Selector] Error saving to storage:', e);
        }
    }

    function loadManualSelectionsFromStorage() {
        try {
            const saved = localStorage.getItem('localeSelector_manualSelections');
            if (saved) {
                manualLayerLocaleSelections = JSON.parse(saved);
            }
        } catch (e) {
            console.error('[Locale Selector] Error loading from storage:', e);
            manualLayerLocaleSelections = {};
        }
    }

    // ========================================
    // BATCH CALCULATION FUNCTIONS (NEW)
    // ========================================

    /**
     * Calculate batch selections for a given function's layer-locale mapping
     * @param {Object} layerLocales - The mapping of layers to their locales
     * @returns {Object} - { batch1: {layer: [locales]}, batch2: {layer: [locales]}, primaryLayer: string, stats: {} }
     */
    function calculateBatchSelections(layerLocales) {
        // Filter out layers with no locales
        const validLayers = Object.entries(layerLocales)
            .filter(([layer, locales]) => locales && locales.length > 0);

        if (validLayers.length === 0) {
            return {
                batch1: {},
                batch2: {},
                primaryLayer: null,
                stats: { batch1Locales: 0, batch2Locales: 0, totalUniqueLocales: 0 }
            };
        }

        // Find the layer with the most locales (primary layer)
        let primaryLayer = null;
        let maxLocales = 0;

        for (const [layer, locales] of validLayers) {
            if (locales.length > maxLocales) {
                maxLocales = locales.length;
                primaryLayer = layer;
            }
        }

        const batch1 = {};
        const batch2 = {};
        const coveredLocales = new Set();

        // Batch 1: Primary layer gets ALL its locales
        batch1[primaryLayer] = [...layerLocales[primaryLayer]];
        layerLocales[primaryLayer].forEach(locale => coveredLocales.add(locale));

        // For other layers, only include locales NOT already covered
        for (const [layer, locales] of validLayers) {
            if (layer === primaryLayer) continue;

            const batch1Locales = [];
            const batch2Locales = [];

            for (const locale of locales) {
                if (!coveredLocales.has(locale)) {
                    // This locale is unique - goes to batch 1
                    batch1Locales.push(locale);
                    coveredLocales.add(locale);
                } else {
                    // This locale is a duplicate - goes to batch 2
                    batch2Locales.push(locale);
                }
            }

            if (batch1Locales.length > 0) {
                batch1[layer] = batch1Locales;
            }
            if (batch2Locales.length > 0) {
                batch2[layer] = batch2Locales;
            }
        }

        // Calculate stats
        let batch1Count = 0;
        let batch2Count = 0;
        Object.values(batch1).forEach(locales => batch1Count += locales.length);
        Object.values(batch2).forEach(locales => batch2Count += locales.length);

        return {
            batch1,
            batch2,
            primaryLayer,
            stats: {
                batch1Locales: batch1Count,
                batch2Locales: batch2Count,
                totalUniqueLocales: coveredLocales.size,
                primaryLayerCount: layerLocales[primaryLayer]?.length || 0
            }
        };
    }

    // ========================================
    // MODAL OBSERVER - Hide modals during processing
    // ========================================

    function startModalObserver() {
        if (modalObserver) return;
        hideExistingModals();

        modalObserver = new MutationObserver((mutations) => {
            if (!isProcessing) return;
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        hideModalElement(node);
                        if (node.querySelectorAll) {
                            node.querySelectorAll('.modal, .modal-backdrop, .modal-dialog, [role="dialog"]').forEach(hideModalElement);
                        }
                    }
                }
                if (mutation.type === 'attributes' && mutation.target.classList) {
                    if (mutation.target.classList.contains('modal') ||
                        mutation.target.classList.contains('modal-backdrop')) {
                        hideModalElement(mutation.target);
                    }
                }
            }
        });

        modalObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });

        console.log('[Locale Selector] Modal observer started');
    }

    function stopModalObserver() {
        if (modalObserver) {
            modalObserver.disconnect();
            modalObserver = null;
            console.log('[Locale Selector] Modal observer stopped');
        }
        showAllModals();
    }

    function hideModalElement(element) {
        if (!element || !element.style) return;
        const isModal = element.classList?.contains('modal') ||
                       element.classList?.contains('modal-backdrop') ||
                       element.classList?.contains('modal-dialog') ||
                       element.getAttribute?.('role') === 'dialog';

        if (isModal) {
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('pointer-events', 'none', 'important');
            element.setAttribute('data-locale-selector-hidden', 'true');
        }
    }

    function hideExistingModals() {
        document.querySelectorAll('.modal, .modal-backdrop, .modal-dialog, [role="dialog"]').forEach(hideModalElement);
    }

    function showAllModals() {
        document.querySelectorAll('[data-locale-selector-hidden="true"]').forEach(element => {
            element.style.removeProperty('opacity');
            element.style.removeProperty('visibility');
            element.style.removeProperty('pointer-events');
            element.removeAttribute('data-locale-selector-hidden');
        });
    }

    // ========================================
    // KEY FIX: ROBUST LOCALE CLEARING AND SELECTION
    // ========================================

    function getMultiselectButtonState(form) {
        const btn = form.querySelector('.multiselect.dropdown-toggle');
        if (!btn) return null;
        const textSpan = btn.querySelector('.multiselect-selected-text');
        return textSpan ? textSpan.textContent.trim() : btn.getAttribute('title') || '';
    }

    async function waitForClearedState(form, maxWaitMs = 5000) {
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitMs) {
            const state = getMultiselectButtonState(form);
            console.log(`[Locale Selector] Current button state: "${state}"`);
            if (state === 'None selected' || state === '') {
                return true;
            }
            await sleep(100);
        }
        return false;
    }

    async function clearAllLocalesInDropdown(form) {
        const multiselectBtn = form.querySelector('.multiselect.dropdown-toggle');
        if (!multiselectBtn) {
            console.log('[Locale Selector] Multiselect button not found');
            return false;
        }

        let currentState = getMultiselectButtonState(form);
        console.log(`[Locale Selector] Initial state before clearing: "${currentState}"`);

        if (currentState === 'None selected' || currentState === '') {
            console.log('[Locale Selector] Already cleared, no action needed');
            return true;
        }

        simulateClick(multiselectBtn);
        await sleep(300);

        let dropdown = document.querySelector('.multiselect-container.dropdown-menu.show') ||
                       document.querySelector('.multiselect-container.dropdown-menu:not([style*="display: none"])') ||
                       document.querySelector('.multiselect-container.dropdown-menu');

        if (!dropdown) {
            console.log('[Locale Selector] Dropdown not found for clearing');
            return false;
        }

        const deselectAllBtn = dropdown.querySelector('button.multiselect-deselect-all') ||
                               dropdown.querySelector('.deselect-all') ||
                               dropdown.querySelector('[data-action="deselect-all"]') ||
                               Array.from(dropdown.querySelectorAll('button')).find(b =>
                                   b.textContent.toLowerCase().includes('deselect') ||
                                   b.textContent.toLowerCase().includes('none'));

        if (deselectAllBtn) {
            console.log('[Locale Selector] Found deselect all button, clicking it');
            simulateClick(deselectAllBtn);
            await sleep(300);
        }

        let maxAttempts = 50;
        let attempt = 0;

        while (attempt < maxAttempts) {
            dropdown = document.querySelector('.multiselect-container.dropdown-menu.show') ||
                       document.querySelector('.multiselect-container.dropdown-menu:not([style*="display: none"])') ||
                       document.querySelector('.multiselect-container.dropdown-menu');

            if (!dropdown) {
                simulateClick(multiselectBtn);
                await sleep(200);
                dropdown = document.querySelector('.multiselect-container.dropdown-menu.show') ||
                           document.querySelector('.multiselect-container.dropdown-menu');
            }

            if (!dropdown) break;

            const checkedBoxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
            console.log(`[Locale Selector] Clearing attempt ${attempt + 1}: Found ${checkedBoxes.length} checked boxes`);

            if (checkedBoxes.length === 0) {
                break;
            }

            const checkbox = checkedBoxes[0];
            const label = checkbox.closest('label') || checkbox.closest('li');
            if (label) {
                simulateClick(label);
            } else {
                simulateClick(checkbox);
            }

            await sleep(100);
            attempt++;
        }

        simulateClick(multiselectBtn);
        await sleep(200);

        const finalState = getMultiselectButtonState(form);
        console.log(`[Locale Selector] State after clearing: "${finalState}"`);

        if (finalState === 'None selected' || finalState === '') {
            console.log('[Locale Selector] Successfully cleared all locales');
            return true;
        }

        console.log('[Locale Selector] First clear attempt failed, trying aggressive clear...');

        simulateClick(multiselectBtn);
        await sleep(300);

        dropdown = document.querySelector('.multiselect-container.dropdown-menu.show') ||
                   document.querySelector('.multiselect-container.dropdown-menu');

        if (dropdown) {
            const allChecked = dropdown.querySelectorAll('input[type="checkbox"]:checked');
            for (const cb of allChecked) {
                const label = cb.closest('label') || cb.closest('li');
                simulateClick(label || cb);
                await sleep(50);
            }
        }

        simulateClick(multiselectBtn);
        await sleep(300);

        const verifyState = getMultiselectButtonState(form);
        const success = verifyState === 'None selected' || verifyState === '';
        console.log(`[Locale Selector] Final verification: "${verifyState}" - Success: ${success}`);

        return success;
    }

    async function selectTargetLocales(locales) {
        const form = document.querySelector('.cms-key-input');
        if (!form) {
            console.log('[Locale Selector] Form not found');
            return false;
        }

        const multiselectBtn = form.querySelector('.multiselect.dropdown-toggle');
        if (!multiselectBtn) {
            console.log('[Locale Selector] Multiselect button not found');
            return false;
        }

        console.log('[Locale Selector] Step 1: Clearing existing selections...');
        const cleared = await clearAllLocalesInDropdown(form);

        if (!cleared) {
            console.log('[Locale Selector] Warning: Could not verify clear state, proceeding anyway...');
        }

        await sleep(200);

        const preSelectState = getMultiselectButtonState(form);
        console.log(`[Locale Selector] State before selecting new locales: "${preSelectState}"`);

        if (preSelectState !== 'None selected' && preSelectState !== '') {
            console.log('[Locale Selector] WARNING: State is not cleared! Attempting to continue anyway...');
        }

        console.log(`[Locale Selector] Step 2: Selecting ${locales.length} locales: ${locales.join(', ')}`);

        simulateClick(multiselectBtn);
        await sleep(400);

        let dropdown = document.querySelector('.multiselect-container.dropdown-menu.show') ||
                       document.querySelector('.multiselect-container.dropdown-menu:not([style*="display: none"])') ||
                       document.querySelector('.multiselect-container.dropdown-menu');

        if (!dropdown) {
            console.log('[Locale Selector] Dropdown menu not found for selection');
            return false;
        }

        const remainingChecked = dropdown.querySelectorAll('input[type="checkbox"]:checked');
        if (remainingChecked.length > 0) {
            console.log(`[Locale Selector] Found ${remainingChecked.length} still checked, clearing them...`);
            for (const cb of remainingChecked) {
                const label = cb.closest('label') || cb.closest('li');
                simulateClick(label || cb);
                await sleep(50);
            }
            await sleep(200);
        }

        let selectedCount = 0;
        for (const locale of locales) {
            dropdown = document.querySelector('.multiselect-container.dropdown-menu.show') ||
                       document.querySelector('.multiselect-container.dropdown-menu');

            if (!dropdown) {
                console.log('[Locale Selector] Dropdown closed unexpectedly, reopening...');
                                simulateClick(multiselectBtn);
                await sleep(200);
                dropdown = document.querySelector('.multiselect-container.dropdown-menu');
            }

            if (!dropdown) continue;

            const checkbox = dropdown.querySelector(`input[type="checkbox"][value="${locale}"]`);
            if (checkbox) {
                if (!checkbox.checked) {
                    const label = checkbox.closest('label') || checkbox.closest('li');
                    simulateClick(label || checkbox);
                    selectedCount++;
                    await sleep(80);
                } else {
                    console.log(`[Locale Selector] Locale ${locale} already checked (unexpected)`);
                }
            } else {
                console.log(`[Locale Selector] Checkbox for locale ${locale} not found`);
            }
        }

        simulateClick(multiselectBtn);
        await sleep(200);

        const finalState = getMultiselectButtonState(form);
        console.log(`[Locale Selector] Final state after selection: "${finalState}" (selected ${selectedCount} locales)`);

        return selectedCount > 0;
    }

    // ========================================
    // MAIN PROCESSING FUNCTION
    // ========================================

    async function processAllRows() {
        if (isProcessing) {
            showNotification('Already processing. Please wait...', 'warning');
            return;
        }

        // Validate selections based on mode
        if (currentMode === 'manual') {
            const hasSelections = Object.values(manualLayerLocaleSelections).some(locales => locales && locales.length > 0);
            if (!hasSelections) {
                showNotification('No locales selected. Please select at least one locale for a layer.', 'warning');
                return;
            }
        }

        if (currentMode === 'batch') {
            const hasSelections = Object.values(batchLayerLocaleSelections).some(locales => locales && locales.length > 0);
            if (!hasSelections) {
                showNotification('No locales in batch selection. Please configure batch settings.', 'warning');
                return;
            }
        }

        isProcessing = true;
        stopRequested = false;
        startModalObserver();

        const rows = document.querySelectorAll('#publish-table tbody tr.target-row');
        let processedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        showNotification(`Starting to process ${rows.length} rows...`, 'info');
        showStopButton();

        for (let i = 0; i < rows.length; i++) {
            if (stopRequested) {
                showNotification('Processing stopped by user', 'warning');
                break;
            }

            const row = rows[i];
            updateProgressIndicator(`Processing row ${i + 1} of ${rows.length}...`);

            try {
                // Check if row already has locales selected
                const targetCell = row.querySelector('td:last-child');
                if (targetCell && !targetCell.textContent.includes('Missing locales')) {
                    console.log(`[Locale Selector] Row ${i + 1} already has locales, skipping`);
                    skippedCount++;
                    continue;
                }

                // Get the layer from the row
                const layerCell = row.querySelector('td:nth-child(4)');
                if (!layerCell) {
                    console.log(`[Locale Selector] No layer cell found for row ${i + 1}`);
                    skippedCount++;
                    continue;
                }

                const layerText = layerCell.textContent.trim();
                const layer = extractLayerFromText(layerText);

                if (!layer) {
                    console.log(`[Locale Selector] Could not extract layer from: ${layerText}`);
                    skippedCount++;
                    continue;
                }

                const locales = getLocalesForLayer(layer);
                if (locales.length === 0) {
                    console.log(`[Locale Selector] No locales configured for layer: ${layer}`);
                    skippedCount++;
                    continue;
                }

                console.log(`[Locale Selector] Processing row ${i + 1}: Layer ${layer} → Locales: ${locales.join(', ')}`);

                // Click the pencil icon
                const pencilIcon = row.querySelector('.fa-pencil');
                if (!pencilIcon) {
                    console.log(`[Locale Selector] No pencil icon found for row ${i + 1}`);
                    skippedCount++;
                    continue;
                }

                simulateClick(pencilIcon);
                await sleep(800);

                // Select locales (this now includes proper clearing)
                const success = await selectTargetLocales(locales);
                if (!success) {
                    console.log(`[Locale Selector] Failed to select locales for row ${i + 1}`);
                    errorCount++;
                    await closeAnyModal();
                    continue;
                }

                await sleep(300);

                // Click Add Document
                const addButton = document.querySelector('.add-button.btn-primary');
                if (!addButton || addButton.disabled) {
                    console.log(`[Locale Selector] Add button not found or disabled for row ${i + 1}`);
                    errorCount++;
                    await closeAnyModal();
                    continue;
                }

                hideExistingModals();
                simulateClick(addButton);
                await sleep(800);

                hideExistingModals();
                await handlePopup();
                await sleep(500);

                processedCount++;

            } catch (error) {
                console.error(`[Locale Selector] Error on row ${i + 1}:`, error);
                errorCount++;
                await closeAnyModal();
            }
        }

        stopModalObserver();
        isProcessing = false;
        hideProgressIndicator();
        hideStopButton();

        const message = `Completed! Processed: ${processedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`;
        showNotification(message, processedCount > 0 ? 'success' : 'warning');
        console.log(`[Locale Selector] ${message}`);
    }

    async function handlePopup() {
        await sleep(300);
        hideExistingModals();

        const allButtons = document.querySelectorAll('button, .btn, [role="button"]');
        let cancelButton = null;
        let doneButton = null;

        for (const btn of allButtons) {
            const text = btn.textContent.trim().toLowerCase();
            if (btn.id === 'localeStopBtn' || btn.id === 'applyLocalesBtn' || btn.id === 'closeDialogBtn') continue;

            if (text === 'cancel' || text === 'no' || text === 'close') {
                cancelButton = btn;
            }
            if (text === 'done' || text === 'yes' || text === 'ok' || text === 'apply') {
                doneButton = btn;
            }
        }

        const closeButton = document.querySelector('.modal .close, .modal [data-dismiss="modal"], .modal .btn-close, [aria-label="Close"]');

        if (cancelButton) {
            console.log('[Locale Selector] Clicking Cancel button');
            simulateClick(cancelButton);
            await sleep(200);
            return true;
        } else if (closeButton) {
            console.log('[Locale Selector] Clicking Close button');
            simulateClick(closeButton);
            await sleep(200);
            return true;
        } else if (doneButton) {
            console.log('[Locale Selector] Clicking Done button');
            simulateClick(doneButton);
            await sleep(200);
            return true;
        }

        console.log('[Locale Selector] No popup buttons found, trying escape key');
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true });
        document.dispatchEvent(escEvent);
        await sleep(200);
        return true;
    }

    async function closeAnyModal() {
        hideExistingModals();
        const closeButtons = document.querySelectorAll('.modal .close, [data-dismiss="modal"], .btn-close');
        for (const btn of closeButtons) {
            simulateClick(btn);
            await sleep(50);
        }
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true });
        document.dispatchEvent(escEvent);
        await sleep(150);
    }

    // ========================================
    // UI COMPONENTS
    // ========================================

    function createMainUI() {
        if (document.getElementById('localeSelectContainer')) return;

        const container = document.createElement('div');
        container.id = 'localeSelectContainer';
        container.style.cssText = `
            margin: 10px 0;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        `;

        // Auto-Select Button
        const autoButton = document.createElement('button');
        autoButton.id = 'localeAutoSelectBtn';
        autoButton.innerHTML = '🌐 Auto-Select Locales';
        autoButton.className = 'btn btn-success';
        autoButton.style.cssText = 'font-weight: bold; padding: 10px 20px;';
        autoButton.addEventListener('click', showAutoConfigDialog);

        // Manual Select Button
        const manualButton = document.createElement('button');
        manualButton.id = 'localeManualSelectBtn';
        manualButton.innerHTML = '📝 Manual Locale Selector';
        manualButton.className = 'btn btn-warning';
        manualButton.style.cssText = 'font-weight: bold; padding: 10px 20px;';
        manualButton.addEventListener('click', showManualSelectorDialog);

        // NEW: Batch Select Button
        const batchButton = document.createElement('button');
        batchButton.id = 'localeBatchSelectBtn';
        batchButton.innerHTML = '📦 Select by Batch';
        batchButton.className = 'btn btn-info';
        batchButton.style.cssText = 'font-weight: bold; padding: 10px 20px;';
        batchButton.addEventListener('click', showBatchSelectorDialog);

        // Help Text
        const helpText = document.createElement('span');
        helpText.style.cssText = 'color: white; font-size: 12px; margin-left: 10px;';
        helpText.textContent = 'Select target locales: Auto (by function), Manual (per layer), or Batch (unique/duplicate split)';

        container.appendChild(autoButton);
        container.appendChild(manualButton);
        container.appendChild(batchButton);
        container.appendChild(helpText);

        const publishTable = document.querySelector('#publish-table');
        if (publishTable && publishTable.parentNode) {
            publishTable.parentNode.insertBefore(container, publishTable);
        }
    }

    // ========================================
    // AUTO-SELECT DIALOG
    // ========================================

    function showAutoConfigDialog() {
        currentMode = 'auto';

        const existingDialog = document.getElementById('localeConfigDialog');
        if (existingDialog) existingDialog.remove();
        const existingOverlay = document.getElementById('localeConfigOverlay');
        if (existingOverlay) existingOverlay.remove();

        const savedVertical = localStorage.getItem('localeSelector_vertical') || 'TSI';
        const savedFunction = localStorage.getItem('localeSelector_function');

        const overlay = document.createElement('div');
        overlay.id = 'localeConfigOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.id = 'localeConfigDialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10001;
            min-width: 500px;
            max-width: 600px;
            max-height: 85vh;
            overflow-y: auto;
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🌐</span>
                Auto-Select Configuration
            </h3>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #444;">
                    Select Vertical:
                </label>
                <select id="verticalSelect" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;">
                    ${Object.entries(VERTICAL_CONFIGS).map(([key, config]) =>
                        `<option value="${key}" ${savedVertical === key ? 'selected' : ''}>${config.name}</option>`
                    ).join('')}
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #444;">
                    Select Function:
                </label>
                <select id="functionSelect" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;">
                </select>
            </div>

            <div id="localePreview" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                <strong style="color: #333; display: block; margin-bottom: 10px;">📋 Layer → Locale Mappings:</strong>
                <div id="mappingsList" style="max-height: 200px; overflow-y: auto; font-size: 12px; font-family: 'Consolas', monospace;"></div>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 10px; margin-bottom: 20px; font-size: 12px;">
                <strong>⚡ Note:</strong> Popups will be automatically hidden during processing for a cleaner experience.
            </div>

            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 25px; flex-wrap: wrap;">
                <button id="applyLocalesBtn" style="
                    padding: 14px 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    ✓ Apply Locales to All Rows
                </button>
                <button id="closeDialogBtn" style="
                    padding: 14px 30px;
                    background: #f8f9fa;
                    color: #333;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">
                    Cancel
                </button>
            </div>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center;">
                ${SCRIPT_NAME} v${SCRIPT_VERSION}
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        const verticalSelect = document.getElementById('verticalSelect');
        const functionSelect = document.getElementById('functionSelect');

        function updateFunctionOptions() {
            const vertical = VERTICAL_CONFIGS[verticalSelect.value];
            functionSelect.innerHTML = '';

            Object.entries(vertical.functions).forEach(([key, func]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = func.name;
                if (savedFunction === key && savedVertical === verticalSelect.value) {
                    option.selected = true;
                }
                functionSelect.appendChild(option);
            });

            updateMappingsPreview();
        }

        function updateMappingsPreview() {
            const vertical = VERTICAL_CONFIGS[verticalSelect.value];
            const func = vertical.functions[functionSelect.value];
            const mappingsList = document.getElementById('mappingsList');

            if (func && func.layerLocales) {
                const mappings = Object.entries(func.layerLocales)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([layer, locales]) => `
                        <div style="padding: 6px 10px; margin: 4px 0; background: white; border-radius: 4px; border-left: 3px solid #667eea;">
                            <strong style="color: #667eea;">${layer}:</strong>
                            <span style="color: #555;">${locales.length > 0 ? locales.join(', ') : '<em>No locales</em>'}</span>
                        </div>
                    `)
                    .join('');
                mappingsList.innerHTML = mappings || '<em>No mappings defined</em>';

                selectedFunction = func;
            }
        }

        verticalSelect.addEventListener('change', () => {
            updateFunctionOptions();
            localStorage.setItem('localeSelector_vertical', verticalSelect.value);
        });

        functionSelect.addEventListener('change', () => {
            updateMappingsPreview();
            localStorage.setItem('localeSelector_function', functionSelect.value);
        });

        updateFunctionOptions();

        document.getElementById('applyLocalesBtn').addEventListener('click', () => {
            closeDialog();
            setTimeout(() => processAllRows(), 100);
        });

        document.getElementById('closeDialogBtn').addEventListener('click', closeDialog);
        overlay.addEventListener('click', closeDialog);

        function closeDialog() {
            document.getElementById('localeConfigDialog')?.remove();
            document.getElementById('localeConfigOverlay')?.remove();
        }
    }

    // ========================================
    // BATCH SELECTOR DIALOG (NEW)
    // ========================================

    function showBatchSelectorDialog() {
        currentMode = 'batch';

        const existingDialog = document.getElementById('localeConfigDialog');
        if (existingDialog) existingDialog.remove();
        const existingOverlay = document.getElementById('localeConfigOverlay');
        if (existingOverlay) existingOverlay.remove();

        const savedVertical = localStorage.getItem('localeSelector_batch_vertical') || 'TSI';
        const savedFunction = localStorage.getItem('localeSelector_batch_function');
        const savedBatch = localStorage.getItem('localeSelector_batch_number') || '1';

        const overlay = document.createElement('div');
        overlay.id = 'localeConfigOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.id = 'localeConfigDialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10001;
            min-width: 600px;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #333; border-bottom: 3px solid #17a2b8; padding-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">📦</span>
                Batch Locale Selector
            </h3>

            <div style="background: #e7f3ff; border: 1px solid #b8daff; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 13px;">
                <strong>ℹ️ How Batch Selection Works:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                    <li><strong>Batch 1:</strong> Primary layer (most locales) gets ALL locales. Other layers get only UNIQUE locales not covered by the primary layer.</li>
                    <li><strong>Batch 2:</strong> All remaining "duplicate" locale-layer combinations.</li>
                </ul>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #444;">
                        Select Vertical:
                    </label>
                    <select id="batchVerticalSelect" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;">
                        ${Object.entries(VERTICAL_CONFIGS).map(([key, config]) =>
                            `<option value="${key}" ${savedVertical === key ? 'selected' : ''}>${config.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #444;">
                        Select Function:
                    </label>
                    <select id="batchFunctionSelect" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </select>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #444;">
                    Select Batch:
                </label>
                <div style="display: flex; gap: 15px;">
                    <label style="display: flex; align-items: center; gap: 8px; padding: 12px 20px; border: 2px solid #17a2b8; border-radius: 6px; cursor: pointer; flex: 1; justify-content: center; background: ${savedBatch === '1' ? '#17a2b8' : 'white'}; color: ${savedBatch === '1' ? 'white' : '#333'};" id="batch1Label">
                        <input type="radio" name="batchNumber" value="1" ${savedBatch === '1' ? 'checked' : ''} style="display: none;">
                        <span style="font-size: 20px;">1️⃣</span>
                        <span><strong>Batch 1</strong><br><small>Unique locales</small></span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 12px 20px; border: 2px solid #17a2b8; border-radius: 6px; cursor: pointer; flex: 1; justify-content: center; background: ${savedBatch === '2' ? '#17a2b8' : 'white'}; color: ${savedBatch === '2' ? 'white' : '#333'};" id="batch2Label">
                        <input type="radio" name="batchNumber" value="2" ${savedBatch === '2' ? 'checked' : ''} style="display: none;">
                        <span style="font-size: 20px;">2️⃣</span>
                        <span><strong>Batch 2</strong><br><small>Duplicate locales</small></span>
                    </label>
                </div>
            </div>

            <div id="batchStatsContainer" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong style="color: #333;">📊 Batch Statistics:</strong>
                    <span id="primaryLayerInfo" style="color: #17a2b8; font-weight: bold;"></span>
                </div>
                <div id="batchStats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                </div>
            </div>

            <div id="batchPreview" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                <strong style="color: #333; display: block; margin-bottom: 10px;">📋 Selected Batch Mappings:</strong>
                <div id="batchMappingsList" style="max-height: 250px; overflow-y: auto; font-size: 12px; font-family: 'Consolas', monospace;"></div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 25px; flex-wrap: wrap;">
                <button id="applyBatchBtn" style="
                    padding: 14px 30px;
                    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    ✓ Apply Batch Selection
                </button>
                <button id="closeDialogBtn" style="
                    padding: 14px 30px;
                    background: #f8f9fa;
                    color: #333;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">
                    Cancel
                </button>
            </div>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center;">
                ${SCRIPT_NAME} v${SCRIPT_VERSION}
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        const verticalSelect = document.getElementById('batchVerticalSelect');
        const functionSelect = document.getElementById('batchFunctionSelect');
        const batch1Label = document.getElementById('batch1Label');
        const batch2Label = document.getElementById('batch2Label');

        let currentBatchData = null;

        function updateBatchRadioStyles() {
            const selectedBatch = document.querySelector('input[name="batchNumber"]:checked')?.value || '1';
            batch1Label.style.background = selectedBatch === '1' ? '#17a2b8' : 'white';
            batch1Label.style.color = selectedBatch === '1' ? 'white' : '#333';
            batch2Label.style.background = selectedBatch === '2' ? '#17a2b8' : 'white';
            batch2Label.style.color = selectedBatch === '2' ? 'white' : '#333';
        }

        function updateFunctionOptions() {
            const vertical = VERTICAL_CONFIGS[verticalSelect.value];
            functionSelect.innerHTML = '';

            Object.entries(vertical.functions).forEach(([key, func]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = func.name;
                if (savedFunction === key && savedVertical === verticalSelect.value) {
                    option.selected = true;
                }
                functionSelect.appendChild(option);
            });

            updateBatchPreview();
        }

        function updateBatchPreview() {
            const vertical = VERTICAL_CONFIGS[verticalSelect.value];
            const func = vertical.functions[functionSelect.value];
            const selectedBatch = document.querySelector('input[name="batchNumber"]:checked')?.value || '1';

            if (!func || !func.layerLocales) {
                document.getElementById('batchMappingsList').innerHTML = '<em>No function selected</em>';
                return;
            }

            // Calculate batch selections
            currentBatchData = calculateBatchSelections(func.layerLocales);

            // Update stats
            const statsContainer = document.getElementById('batchStats');
            const primaryInfo = document.getElementById('primaryLayerInfo');

            primaryInfo.textContent = currentBatchData.primaryLayer ?
                `Primary Layer: ${currentBatchData.primaryLayer} (${currentBatchData.stats.primaryLayerCount} locales)` :
                'No primary layer';

            statsContainer.innerHTML = `
                <div style="padding: 10px; background: ${selectedBatch === '1' ? '#d4edda' : '#f8f9fa'}; border-radius: 6px; border: 2px solid ${selectedBatch === '1' ? '#28a745' : '#dee2e6'};">
                    <div style="font-size: 24px; font-weight: bold; color: #28a745;">${currentBatchData.stats.batch1Locales}</div>
                    <div style="font-size: 11px; color: #666;">Batch 1 Locales</div>
                </div>
                <div style="padding: 10px; background: ${selectedBatch === '2' ? '#fff3cd' : '#f8f9fa'}; border-radius: 6px; border: 2px solid ${selectedBatch === '2' ? '#ffc107' : '#dee2e6'};">
                    <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${currentBatchData.stats.batch2Locales}</div>
                    <div style="font-size: 11px; color: #666;">Batch 2 Locales</div>
                </div>
                <div style="padding: 10px; background: #e7f3ff; border-radius: 6px; border: 2px solid #b8daff;">
                    <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${currentBatchData.stats.totalUniqueLocales}</div>
                    <div style="font-size: 11px; color: #666;">Total Unique</div>
                </div>
            `;

            // Update mappings list
            const mappingsList = document.getElementById('batchMappingsList');
            const batchToShow = selectedBatch === '1' ? currentBatchData.batch1 : currentBatchData.batch2;

            if (Object.keys(batchToShow).length === 0) {
                mappingsList.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">
                    <em>No locales in Batch ${selectedBatch}</em>
                </div>`;
            } else {
                const mappings = Object.entries(batchToShow)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([layer, locales]) => {
                        const isPrimary = layer === currentBatchData.primaryLayer && selectedBatch === '1';
                        return `
                            <div style="padding: 8px 12px; margin: 4px 0; background: white; border-radius: 4px; border-left: 4px solid ${isPrimary ? '#28a745' : '#17a2b8'};">
                                <strong style="color: ${isPrimary ? '#28a745' : '#17a2b8'};">
                                    ${layer}${isPrimary ? ' ⭐ (Primary)' : ''}:
                                </strong>
                                <span style="color: #555;">${locales.join(', ')}</span>
                                <span style="color: #999; font-size: 10px; margin-left: 8px;">(${locales.length})</span>
                            </div>
                        `;
                    })
                    .join('');
                mappingsList.innerHTML = mappings;
            }

            // Store the batch selections for processing
            batchLayerLocaleSelections = batchToShow;
        }

        // Event listeners
        verticalSelect.addEventListener('change', () => {
            updateFunctionOptions();
            localStorage.setItem('localeSelector_batch_vertical', verticalSelect.value);
        });

        functionSelect.addEventListener('change', () => {
            updateBatchPreview();
            localStorage.setItem('localeSelector_batch_function', functionSelect.value);
        });

        batch1Label.addEventListener('click', () => {
            document.querySelector('input[name="batchNumber"][value="1"]').checked = true;
            updateBatchRadioStyles();
            updateBatchPreview();
            localStorage.setItem('localeSelector_batch_number', '1');
        });

        batch2Label.addEventListener('click', () => {
            document.querySelector('input[name="batchNumber"][value="2"]').checked = true;
            updateBatchRadioStyles();
            updateBatchPreview();
            localStorage.setItem('localeSelector_batch_number', '2');
        });

        // Initialize
        updateFunctionOptions();
        updateBatchRadioStyles();

        document.getElementById('applyBatchBtn').addEventListener('click', () => {
            if (Object.keys(batchLayerLocaleSelections).length === 0) {
                showNotification('No locales in selected batch!', 'warning');
                return;
            }
            closeDialog();
            setTimeout(() => processAllRows(), 100);
        });

        document.getElementById('closeDialogBtn').addEventListener('click', closeDialog);
        overlay.addEventListener('click', closeDialog);

        function closeDialog() {
            document.getElementById('localeConfigDialog')?.remove();
            document.getElementById('localeConfigOverlay')?.remove();
        }
    }

    // ========================================
    // MANUAL SELECTOR DIALOG
    // ========================================

    function showManualSelectorDialog() {
        currentMode = 'manual';

        const existingDialog = document.getElementById('localeConfigDialog');
        if (existingDialog) existingDialog.remove();
        const existingOverlay = document.getElementById('localeConfigOverlay');
        if (existingOverlay) existingOverlay.remove();

        loadManualSelectionsFromStorage();

        const layers = getUniqueLayers();

        if (layers.length === 0) {
            showNotification('No layers found on this page.', 'warning');
            return;
        }

        // Initialize selections for new layers
        layers.forEach(layer => {
            if (!manualLayerLocaleSelections[layer]) {
                manualLayerLocaleSelections[layer] = [];
            }
        });

        const overlay = document.createElement('div');
        overlay.id = 'localeConfigOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.id = 'localeConfigDialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            z-index: 10001;
            width: 95vw;
            max-width: 1400px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

        dialog.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 3px solid #f5576c;">
                <h3 style="margin: 0; color: #333; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">📝</span>
                    Manual Locale Selector
                </h3>
                <div style="display: flex; gap: 10px;">
                    <button id="clearAllSelectionsBtn" class="btn btn-sm btn-outline-secondary" style="font-size: 12px;">Clear All Locales</button>
                    <button id="saveSelectionsBtn" class="btn btn-sm btn-outline-primary" style="font-size: 12px;">💾 Save Selections</button>
                </div>
            </div>

            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                <strong>Quick Select Groups:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                    ${Object.keys(LOCALE_GROUPS).map(group => `
                        <button class="quick-group-btn btn btn-sm btn-outline-info" data-group="${group}" style="font-size: 11px;">
                            ${group}
                        </button>
                    `).join('')}
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #666;">
                    <em>Click a group to add those locales to all selected layers (hold Shift to remove)</em>
                </div>
            </div>

            <div style="flex: 1; overflow: auto; border: 1px solid #ddd; border-radius: 6px;">
                <table id="localeSelectionTable" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead style="position: sticky; top: 0; background: #f8f9fa; z-index: 10;">
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left; min-width: 80px; position: sticky; left: 0; background: #f8f9fa; z-index: 11;">
                                <input type="checkbox" id="selectAllLayers" title="Select/Deselect all layers">
                                Layer
                            </th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center; min-width: 60px;">
                                Actions
                            </th>
                            ${ALL_LOCALES.map(locale => `
                                <th style="padding: 4px; border: 1px solid #ddd; text-align: center; min-width: 50px; cursor: pointer; font-size: 10px;"
                                    class="locale-header" data-locale="${locale}" title="Click to toggle ${locale} for all layers">
                                    ${locale.split('-')[0]}<br><span style="font-size: 9px; color: #666;">${locale.split('-')[1]}</span>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${layers.map(layer => `
                            <tr data-layer="${layer}">
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; position: sticky; left: 0; background: white; z-index: 5;">
                                    <input type="checkbox" class="layer-checkbox" data-layer="${layer}" ${manualLayerLocaleSelections[layer]?.length > 0 ? 'checked' : ''}>
                                    ${layer}
                                </td>
                                <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">
                                    <button class="btn btn-xs select-all-row" data-layer="${layer}" title="Select all" style="padding: 2px 6px; font-size: 10px;">All</button>
                                    <button class="btn btn-xs clear-row" data-layer="${layer}" title="Clear all" style="padding: 2px 6px; font-size: 10px;">None</button>
                                </td>
                                ${ALL_LOCALES.map(locale => `
                                    <td style="padding: 2px; border: 1px solid #ddd; text-align: center;">
                                        <input type="checkbox" class="locale-checkbox" data-layer="${layer}" data-locale="${locale}"
                                            ${manualLayerLocaleSelections[layer]?.includes(locale) ? 'checked' : ''}>
                                    </td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div id="selectionSummary" style="font-size: 12px; color: #666;"></div>
                    <div style="display: flex; gap: 10px;">
                        <button id="applyLocalesBtn" style="
                            padding: 12px 30px;
                            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                        ">
                            ✓ Apply Selections
                        </button>
                        <button id="closeDialogBtn" style="
                            padding: 12px 30px;
                            background: #f8f9fa;
                            color: #333;
                            border: 2px solid #ddd;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            <div style="margin-top: 10px; font-size: 11px; color: #888; text-align: center;">
                ${SCRIPT_NAME} v${SCRIPT_VERSION}
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        // Initialize event handlers
        initializeManualDialogEventHandlers(layers);
        updateSelectionSummary();

        // Close handlers
        document.getElementById('closeDialogBtn').addEventListener('click', closeDialog);
        overlay.addEventListener('click', closeDialog);

        document.getElementById('applyLocalesBtn').addEventListener('click', () => {
            updateSelectionsFromTable();
            saveManualSelectionsToStorage();
            closeDialog();
            processAllRows();
        });

        function closeDialog() {
            document.getElementById('localeConfigDialog')?.remove();
            document.getElementById('localeConfigOverlay')?.remove();
        }
    }

    function initializeManualDialogEventHandlers(layers) {
        // Locale checkbox change
        document.querySelectorAll('.locale-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateSelectionsFromTable();
                updateSelectionSummary();
            });
        });

        // Select all in row
        document.querySelectorAll('.select-all-row').forEach(btn => {
            btn.addEventListener('click', () => {
                const layer = btn.dataset.layer;
                document.querySelectorAll(`.locale-checkbox[data-layer="${layer}"]`).forEach(cb => {
                    cb.checked = true;
                });
                updateSelectionsFromTable();
                updateSelectionSummary();
            });
        });

        // Clear row
        document.querySelectorAll('.clear-row').forEach(btn => {
            btn.addEventListener('click', () => {
                const layer = btn.dataset.layer;
                document.querySelectorAll(`.locale-checkbox[data-layer="${layer}"]`).forEach(cb => {
                    cb.checked = false;
                });
                updateSelectionsFromTable();
                updateSelectionSummary();
            });
        });

        // Column header click (toggle locale for all layers)
        document.querySelectorAll('.locale-header').forEach(header => {
            header.addEventListener('click', () => {
                const locale = header.dataset.locale;
                const checkboxes = document.querySelectorAll(`.locale-checkbox[data-locale="${locale}"]`);
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);

                checkboxes.forEach(cb => {
                    cb.checked = !allChecked;
                });
                updateSelectionsFromTable();
                updateSelectionSummary();
            });
        });

        // Select all layers checkbox
        document.getElementById('selectAllLayers').addEventListener('change', (e) => {
            document.querySelectorAll('.layer-checkbox').forEach(cb => {
                cb.checked = e.target.checked;
            });
        });

        // Quick group buttons
        document.querySelectorAll('.quick-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const group = btn.dataset.group;
                const locales = LOCALE_GROUPS[group];
                const isShiftHeld = e.shiftKey;

                // Get selected layers (or all if none selected)
                const selectedLayers = Array.from(document.querySelectorAll('.layer-checkbox:checked')).map(cb => cb.dataset.layer);
                const targetLayers = selectedLayers.length > 0 ? selectedLayers : layers;

                targetLayers.forEach(layer => {
                    locales.forEach(locale => {
                        const checkbox = document.querySelector(`.locale-checkbox[data-layer="${layer}"][data-locale="${locale}"]`);
                        if (checkbox) {
                            checkbox.checked = !isShiftHeld;
                        }
                    });
                });

                updateSelectionsFromTable();
                updateSelectionSummary();
            });
        });

        // Clear all button
        document.getElementById('clearAllSelectionsBtn').addEventListener('click', () => {
            document.querySelectorAll('.locale-checkbox').forEach(cb => {
                cb.checked = false;
            });
            updateSelectionsFromTable();
            updateSelectionSummary();
        });

        // Save selections button
        document.getElementById('saveSelectionsBtn').addEventListener('click', () => {
            updateSelectionsFromTable();
            saveManualSelectionsToStorage();
            showNotification('Selections saved!', 'success');
        });
    }

    function updateSelectionsFromTable() {
        manualLayerLocaleSelections = {};

        document.querySelectorAll('#localeSelectionTable tbody tr').forEach(row => {
            const layer = row.dataset.layer;
            const selectedLocales = [];

            row.querySelectorAll('.locale-checkbox:checked').forEach(cb => {
                selectedLocales.push(cb.dataset.locale);
            });

            manualLayerLocaleSelections[layer] = selectedLocales;
        });
    }

    function updateSelectionSummary() {
        const summary = document.getElementById('selectionSummary');
        if (!summary) return;

        let totalSelections = 0;
        let layersWithSelections = 0;

        Object.entries(manualLayerLocaleSelections).forEach(([layer, locales]) => {
            if (locales && locales.length > 0) {
                layersWithSelections++;
                totalSelections += locales.length;
            }
        });

        summary.innerHTML = `
            <strong>${layersWithSelections}</strong> layers with selections,
            <strong>${totalSelections}</strong> total locale assignments
        `;
    }

    // ========================================
    // NOTIFICATION & PROGRESS UI
    // ========================================

    function showNotification(message, type = 'info') {
        const existing = document.getElementById('localeNotification');
        if (existing) existing.remove();

        const colors = {
            success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            error: 'linear-gradient(135deg, #cb2d3e 0%, #ef473a 100%)',
            warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };

        const notification = document.createElement('div');
        notification.id = 'localeNotification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${colors[type] || colors.info};
            color: white;
            border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.25);
            z-index: 10005;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
            animation: slideInRight 0.4s ease;
        `;
        notification.textContent = message;

        if (!document.getElementById('localeAnimationStyles')) {
            const style = document.createElement('style');
            style.id = 'localeAnimationStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease forwards';
            setTimeout(() => notification.remove(), 400);
        }, 5000);
    }

    function updateProgressIndicator(text) {
        let indicator = document.getElementById('localeProgressIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'localeProgressIndicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px;
                z-index: 10005;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            `;
            document.body.appendChild(indicator);
        }
        indicator.textContent = text;
    }

    function hideProgressIndicator() {
        const indicator = document.getElementById('localeProgressIndicator');
        if (indicator) indicator.remove();
    }

    function showStopButton() {
        if (document.getElementById('localeStopBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'localeStopBtn';
        btn.textContent = '⏹ Stop Processing';
        btn.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 10px 20px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            z-index: 10005;
            font-weight: bold;
        `;
        btn.addEventListener('click', () => {
            stopRequested = true;
            btn.textContent = 'Stopping...';
            btn.disabled = true;
        });
        document.body.appendChild(btn);
    }

    function hideStopButton() {
        const btn = document.getElementById('localeStopBtn');
        if (btn) btn.remove();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    function initialize() {
        if (isInitialized) return;

        const publishTable = document.querySelector('#publish-table');
        if (publishTable) {
            isInitialized = true;
            createMainUI();
            console.log(`[${SCRIPT_NAME}] ✓ Initialized successfully (v${SCRIPT_VERSION})`);
            return true;
        }
        return false;
    }

    if (!initialize()) {
        const observer = new MutationObserver((mutations, obs) => {
            if (initialize()) {
                obs.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            if (!isInitialized) {
                console.log(`[${SCRIPT_NAME}] Timeout waiting for publish table`);
            }
        }, 30000);
    }

})();
