// ==UserScript==
// @name         Content Validator
// @namespace    https://github.com/MajaBukvic/Scripts
// @version      1.0
// @description  Validates content and exports results to CSV
// @author       Your Name
// @match        https://share.amazon.com/sites/amazonwatson/*
// @grant        GM_download
// @license      MIT
// @supportURL   https://github.com/MajaBukvic/Scripts/issues
// @homepage     https://github.com/MajaBukvic/Scripts/tree/main/Content-validator
// ==/UserScript==

(function() {
    'use strict';

    // Add validation button to Watson header
    function addValidationButton() {
        const menuContainer = document.querySelector('div[style*="position:relative;float:right;right:25px;padding-top:7px;"]');

        if (menuContainer) {
            const span = document.createElement('span');
            const link = document.createElement('a');
            link.className = 'watson-menu-link';
            link.href = '#';
            link.style.cursor = 'pointer';
            link.innerHTML = '🔍 Validate Content';

            link.addEventListener('click', (e) => {
                e.preventDefault();
                validateAndExport();
            });

            span.appendChild(link);

            // Insert after Export SOP
            const exportContainer = document.getElementById('exportLinkContainer');
            if (exportContainer) {
                exportContainer.parentNode.insertBefore(span, exportContainer.nextSibling);
            } else {
                menuContainer.appendChild(span);
            }
        }
    }

    // Initialize button when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addValidationButton);
    } else {
        addValidationButton();
    }

    function validateAndExport() {
        // Find all divs with webpartid
        const contentDivs = document.querySelectorAll('div[webpartid]');
        if (!contentDivs || contentDivs.length === 0) {
            alert('No content divs with webpartid found on this page!');
            return;
        }

        const issues = [];

        // Process each webpartid div
        contentDivs.forEach(div => {
            const contentHTML = div.outerHTML;
            const parser = new DOMParser();
            const doc = parser.parseFromString(contentHTML, "text/html");
            const contentDoc = doc.querySelector('div[webpartid]');

            validationRules.forEach(rule => {
                try {
                    const category = rule.category.toLowerCase();
                    switch(category) {
                        case 'html':
                            checkHtmlRule(rule, contentDoc, contentHTML, issues);
                            break;
                        case 'css':
                            checkCssRule(rule, contentHTML, issues);
                            break;
                        case 'accessibility':
                            checkAccessibilityRule(rule, contentDoc, issues);
                            break;
                        case 'content_structure':
                            checkContentStructureRule(rule, contentDoc, contentHTML, issues);
                            break;
                        case 'interactive':
                            checkInteractiveRule(rule, contentDoc, issues);
                            break;
                    }
                } catch (e) {
                    console.error(`Error processing rule: ${rule.pattern}`, e);
                }
            });
        });

        if (issues.length > 0) {
            exportToCSV(issues);
        } else {
            alert('No issues found in the content!');
        }
    }
    function checkHtmlRule(rule, doc, html, issues) {
        try {
            if (rule.checkType === "required_tag") {
                const elements = doc.querySelectorAll(rule.pattern.replace(/[<>]/g, ''));
                if (elements.length === 0 && rule.required) {
                    addIssue(issues, "HTML", rule);
                }
            } else if (rule.checkType === "forbidden_tag") {
                const elements = doc.querySelectorAll(rule.pattern.replace(/[<>]/g, ''));
                if (elements.length > 0) {
                    addIssue(issues, "HTML", rule, elements.length);
                }
            } else if (rule.checkType === "regex") {
                const regex = new RegExp(rule.pattern, 'gi');
                const matches = html.match(regex);
                if (matches) {
                    addIssue(issues, "HTML", rule, matches.length);
                }
            } else if (rule.checkType === "duplicate_check") {
                const regex = new RegExp(rule.pattern, 'gi');
                const matches = Array.from(html.matchAll(regex));
                const ids = matches.map(match => match[1]);
                const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
                if (duplicates.length > 0) {
                    addIssue(issues, "HTML", rule, duplicates.length);
                }
            }
        } catch (e) {
            console.error(`Error in HTML rule ${rule.pattern}: ${e}`);
        }
    }

    function checkCssRule(rule, html, issues) {
        try {
            if (rule.checkType === "forbidden_property" || rule.checkType === "regex") {
                const regex = new RegExp(rule.pattern, 'gi');
                const matches = html.match(regex);
                if (matches) {
                    addIssue(issues, "CSS", rule, matches.length);
                }
            } else if (rule.checkType === "required_property") {
                const regex = new RegExp(rule.pattern, 'gi');
                const matches = html.match(regex);
                if (!matches && rule.required) {
                    addIssue(issues, "CSS", rule);
                }
            }
        } catch (e) {
            console.error(`Error in CSS rule ${rule.pattern}: ${e}`);
        }
    }

    function checkAccessibilityRule(rule, doc, issues) {
        try {
            if (rule.checkType === "missing_alt") {
                const elements = doc.querySelectorAll('img:not([alt]), img[alt=""]');
                if (elements.length > 0) {
                    addIssue(issues, "Accessibility", rule, elements.length);
                }
            } else if (rule.checkType === "regex") {
                const regex = new RegExp(rule.pattern, 'gi');
                const html = doc.outerHTML;
                const matches = html.match(regex);
                if (matches) {
                    addIssue(issues, "Accessibility", rule, matches.length);
                }
            } else if (rule.checkType === "required_tag") {
                const elements = doc.querySelectorAll(rule.pattern.replace(/[<>]/g, ''));
                if (elements.length === 0 && rule.required) {
                    addIssue(issues, "Accessibility", rule);
                }
            }
        } catch (e) {
            console.error(`Error in accessibility rule ${rule.pattern}: ${e}`);
        }
    }

    function checkContentStructureRule(rule, doc, html, issues) {
        try {
            if (rule.checkType === "percentage_check") {
                const regex = new RegExp(rule.pattern, 'gi');
                const matches = html.match(regex);
                if (matches && matches.length > 0) {
                    const contentLength = html.length;
                    const matchesLength = matches.join('').length;
                    if (matchesLength / contentLength > 0.3) {
                        addIssue(issues, "Content Structure", rule);
                    }
                }
            } else if (rule.checkType === "combined_percentage_check") {
                const regex = new RegExp(rule.pattern, 'gi');
                const matches = html.match(regex);
                if (matches && matches.length > 0) {
                    const contentLength = html.length;
                    const matchesLength = matches.join('').length;
                    if (matchesLength / contentLength > 0.5) {
                        addIssue(issues, "Content Structure", rule);
                    }
                }
            } else if (rule.checkType === "ratio_check") {
                // Handle ratio checks if needed
                console.log("Ratio check not implemented yet");
            }
        } catch (e) {
            console.error(`Error in content structure rule ${rule.pattern}: ${e}`);
        }
    }

    function checkInteractiveRule(rule, doc, issues) {
        try {
            if (rule.checkType === "regex") {
                const regex = new RegExp(rule.pattern, 'gi');
                const html = doc.outerHTML;
                const matches = html.match(regex);
                if (matches) {
                    addIssue(issues, "Interactive", rule, matches.length);
                }
            }
        } catch (e) {
            console.error(`Error in interactive rule ${rule.pattern}: ${e}`);
        }
    }
    function addIssue(issues, type, rule, count = null) {
        let description = rule.description;
        if (count !== null) {
            description = `Found ${count} instances of ${description}`;
        }

        // Add location information if possible
        let location = '';
        try {
            const regex = new RegExp(rule.pattern, 'gi');
            const match = regex.exec(document.documentElement.outerHTML);
            if (match) {
                const context = match.input.substr(Math.max(0, match.index - 50), 100);
                location = `...${context}...`;
            }
        } catch (e) {
            console.log('Could not determine location for issue');
        }

        issues.push({
            type: type,
            element: rule.pattern,
            issue: description,
            suggestion: rule.suggestion,
            location: location
        });
    }

    function exportToCSV(issues) {
        try {
            // Add timestamp to report
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            // Include more detailed information in the headers
            const headers = ['Type', 'Element', 'Issue', 'Suggestion', 'Location in Code'];
            const csvContent = [
                headers.join(','),
                ...issues.map(issue => [
                    issue.type,
                    issue.element,
                    issue.issue,
                    issue.suggestion,
                    issue.location || 'N/A'
                ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

            // Create more descriptive filename
            const pageTitle = document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `content-validation_${pageTitle}_${timestamp}.csv`;

            GM_download({
                url: URL.createObjectURL(blob),
                name: filename
            });

            // Show summary to user
            const summary = summarizeIssues(issues);
            alert(`Validation complete!\n\n${summary}\n\nReport saved as: ${filename}`);
        } catch (e) {
            console.error('Error exporting to CSV:', e);
            alert('Error creating validation report. Check console for details.');
        }
    }

    function summarizeIssues(issues) {
        // Create a summary of issues by type
        const summary = {};
        issues.forEach(issue => {
            if (!summary[issue.type]) {
                summary[issue.type] = 0;
            }
            summary[issue.type]++;
        });

        // Format the summary
        let summaryText = `Found ${issues.length} total issues:\n`;
        for (const [type, count] of Object.entries(summary)) {
            summaryText += `\n${type}: ${count} issues`;
        }

        return summaryText;
    }

    // Utility function to check if element is visible
    function isVisible(element) {
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }

    // Utility function to get element's XPath
    function getXPath(element) {
        if (!element) return '';
        try {
            if (element.id) {
                return `//*[@id="${element.id}"]`;
            }
            if (element === document.body) {
                return '/html/body';
            }
            let path = '';
            while (element.parentNode) {
                let sibCount = 0;
                let sibIndex = 0;
                for (let sib = element.previousSibling; sib; sib = sib.previousSibling) {
                    if (sib.nodeType === 1 && sib.tagName === element.tagName) {
                        sibCount++;
                    }
                }
                for (let sib = element; sib; sib = sib.previousSibling) {
                    if (sib.nodeType === 1 && sib.tagName === element.tagName) {
                        sibIndex++;
                    }
                }
                const tagName = element.tagName.toLowerCase();
                const pathIndex = (sibCount > 0 ? `[${sibIndex}]` : '');
                path = `/${tagName}${pathIndex}${path}`;
                element = element.parentNode;
            }
            return path;
        } catch (e) {
            console.error('Error generating XPath:', e);
            return '';
        }
    }

// Define validation rules
const validationRules = [
  {
    "category": "html",
    "checkType": "required_tag",
    "pattern": "<title>",
    "required": true,
    "suggestion": "Include descriptive <title> tag",
    "description": "Missing <title> tag"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table[^>]*>(?!([\\s\\S]*?<thead|[\\s\\S]*?<tr[^>]*>\\s*<th))",
    "required": false,
    "suggestion": "Tables should have either a <thead> section or a first row with <th> elements for proper structure and accessibility",
    "description": "Table missing header structure (no thead or th elements)"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table[^>]*>[\\s\\S]*?<tr[^>]*>[\\s\\S]*?</tr>[\\s\\S]*?(?!<tr)[\\s\\S]*?</table>",
    "required": false,
    "suggestion": "Don't use tables for single rows of content. Consider using divs with appropriate styling or a more semantic structure",
    "description": "Single-row table detected - tables should be used for data relationships, not layout"
  },
  {
    "category": "content_structure",
    "checkType": "regex",
    "pattern": "<table[^>]*>\\s*(?:<thead>)?\\s*<tr[^>]*>[\\s\\S]*?</tr>\\s*(?:</thead>)?\\s*(?!<tr)[\\s\\S]*?</table>",
    "required": false,
    "suggestion": "Single row tables indicate potential misuse of tables for layout. Consider:\n1. For layout: Use CSS Grid or Flexbox\n2. For data: Add more rows or use a different component\n3. For lists: Use <ul> or <ol>",
    "description": "Table with single row detected - might be misused for layout"
  },
  {
    "category": "html",
    "checkType": "forbidden_tag",
    "pattern": "<font>",
    "required": false,
    "suggestion": "Remove deprecated <font> tag",
    "description": "Deprecated tag used"
  },
  {
    "category": "html",
    "checkType": "forbidden_tag",
    "pattern": "<center>",
    "required": false,
    "suggestion": "Replace with CSS text-align",
    "description": "Deprecated <center> tag"
  },
  {
    "category": "html",
    "checkType": "forbidden_tag",
    "pattern": "<marquee>",
    "required": false,
    "suggestion": "Avoid <marquee>; use CSS animation instead",
    "description": "Deprecated <marquee> element"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]+id\\s*=\\s*['\\\"]content['\\\"]?",
    "required": false,
    "suggestion": "Use <main> instead of <div id='content'>",
    "description": "Non-semantic main container found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<section(?![^>]*aria-label)[^>]*>",
    "required": false,
    "suggestion": "Add aria-label to <section> for screen reader clarity",
    "description": "Section missing aria-label"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<header(?![^>]*role=)[^>]*>",
    "required": false,
    "suggestion": "Add role='banner' for header landmarks",
    "description": "Missing ARIA role on header"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<footer(?![^>]*role=)[^>]*>",
    "required": false,
    "suggestion": "Add role='contentinfo' for footer",
    "description": "Footer missing ARIA role"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<nav(?![^>]*aria-label)[^>]*>",
    "required": false,
    "suggestion": "Provide aria-label for navigation menus",
    "description": "Navigation missing label"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<article(?![^>]*aria-labelledby)[^>]*>",
    "required": false,
    "suggestion": "Add aria-labelledby for article region",
    "description": "Article missing label"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<th(?![^>]*scope=)[^>]*>",
    "required": false,
    "suggestion": "Add scope='col' or 'row'",
    "description": "Table header missing scope"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table(?![^>]*summary=)[^>]*>",
    "required": false,
    "suggestion": "Add summary/caption for table context",
    "description": "Table missing summary"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<ul[^>]*>(?!.*<li>)",
    "required": false,
    "suggestion": "Ensure lists contain <li> elements",
    "description": "Empty list detected"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<ol[^>]*>(?!.*<li>)",
    "required": false,
    "suggestion": "Ensure ordered lists contain <li>",
    "description": "Empty ordered list"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<blockquote(?![^>]*cite=)[^>]*>",
    "required": false,
    "suggestion": "Include cite attribute for blockquotes",
    "description": "Missing citation source"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<dl(?![^>]*dt)[^>]*>",
    "required": false,
    "suggestion": "Ensure <dl> contains <dt>/<dd> pairs",
    "description": "Malformed description list"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<meta\\s+name=['\\\"]description['\\\"]\\s+content=['\\\"]{01}['\\\"]{01}",
    "required": true,
    "suggestion": "Add meta description",
    "description": "Missing meta description"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<meta\\s+name=['\\\"]viewport['\\\"].*>",
    "required": true,
    "suggestion": "Add viewport meta for responsiveness",
    "description": "Missing viewport tag"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<link[^>]*rel=['\\\"]canonical['\\\"]",
    "required": true,
    "suggestion": "Add canonical link to prevent duplicate content",
    "description": "Missing canonical link"
  },
  {
    "category": "accessibility",
    "checkType": "missing_alt",
    "pattern": "alt=\"\"",
    "required": false,
    "suggestion": "Add descriptive alt text for all <img>",
    "description": "Image missing alt text"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<button(?![^>]*aria-label)(?![^>]*title)[^>]*>",
    "required": false,
    "suggestion": "Add aria-label or title",
    "description": "Button missing accessible name"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<input(?![^>]*aria-label)(?![^>]*title)[^>]*>",
    "required": false,
    "suggestion": "Add label, aria-label, or title",
    "description": "Input missing label"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<textarea(?![^>]*aria-label)(?![^>]*title)[^>]*>",
    "required": false,
    "suggestion": "Add label to text areas",
    "description": "Textarea missing label"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<a(?![^>]*href=)[^>]*>",
    "required": false,
    "suggestion": "Add href or use <button>",
    "description": "Anchor missing href"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<a[^>]*href=['\\\"]#['\\\"]",
    "required": false,
    "suggestion": "Provide valid link targets",
    "description": "Anchor links to #"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<iframe(?![^>]*title)[^>]*>",
    "required": false,
    "suggestion": "Add title for iframe",
    "description": "Iframe missing title"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<video(?![^>]*controls)[^>]*>",
    "required": false,
    "suggestion": "Add controls to videos",
    "description": "Video missing controls"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<audio(?![^>]*controls)[^>]*>",
    "required": false,
    "suggestion": "Add controls to audio",
    "description": "Audio missing controls"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<form(?![^>]*aria-label)(?![^>]*label)[^>]*>",
    "required": false,
    "suggestion": "Add form label or ARIA label",
    "description": "Form missing accessible name"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<th(?![^>]*scope=)[^>]*>",
    "required": false,
    "suggestion": "Add scope='col' or 'row' to <th>",
    "description": "Missing table header scope"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<td[^>]*headers=",
    "required": false,
    "suggestion": "Ensure <td> references <th> IDs",
    "description": "Table data not linked to headers"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "tabindex\\s*=\\s*['\\\"]-[1-9]+['\\\"]",
    "required": false,
    "suggestion": "Do not remove elements from tab order",
    "description": "Negative tabindex"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<div[^>]*role=['\\\"]presentation['\\\"]",
    "required": false,
    "suggestion": "Confirm no interactive children",
    "description": "Potential ARIA misuse"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "style\\s*=\\s*['\\\"][^'\\\"]*color\\s*:\\s*(#ff0000|#f00|red)[^'\\\"]*['\\\"]",
    "required": false,
    "suggestion": "Avoid pure red text",
    "description": "Low contrast red text"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "@media\\s*\\(prefers-reduced-motion:\\s*reduce\\)",
    "required": true,
    "suggestion": "Respect reduced motion preference",
    "description": "Missing reduced-motion query"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "@media\\s*\\(forced-colors:\\s*active\\)",
    "required": true,
    "suggestion": "Ensure high contrast support",
    "description": "Missing forced-color query"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": ":focus-visible",
    "required": true,
    "suggestion": "Ensure focus outlines visible",
    "description": "Missing focus-visible handling"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "\\.visually-hidden",
    "required": true,
    "suggestion": "Include visually hidden class for screen readers",
    "description": "Missing visually-hidden support"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "font-family\\s*:\\s*(?!.*Amazon Ember)",
    "required": true,
    "suggestion": "Use Amazon Ember font",
    "description": "Non-standard font family"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "color\\s*:\\s*(#000|black)",
    "required": false,
    "suggestion": "Use var(--primary-color) for text",
    "description": "Avoid pure black text"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "background-color\\s*:\\s*(#fff|white)",
    "required": false,
    "suggestion": "Use var(--light-gray) for background",
    "description": "Avoid pure white"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "float\\s*:\\s*(left|right)",
    "required": false,
    "suggestion": "Use flex/grid layout",
    "description": "Floats are deprecated"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "important",
    "required": true,
    "suggestion": "Avoid !important; fix cascade",
    "description": "!important used"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "outline:\\s*none",
    "required": true,
    "suggestion": "Keep focus outlines",
    "description": "Focus indicator removed"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "display\\s*:\\s*inline-block",
    "required": true,
    "suggestion": "Prefer flexbox/grid",
    "description": "Inline-block layout discouraged"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "z-index\\s*:\\s*\\d{3}",
    "required": false,
    "suggestion": "Keep z-index <100",
    "description": "High z-index found"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.button--[1-4]",
    "required": true,
    "suggestion": "Use Watson button classes for consistency",
    "description": "Missing standard button style"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "style=\"[^\"]*display:\\s*none",
    "required": false,
    "suggestion": "Carefully review use of display:none - ensure content isn't being hidden inappropriately",
    "description": "Hidden content detected with display:none"
},
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.animated_button_(red|green)",
    "required": true,
    "suggestion": "Use standard Watson animated buttons",
    "description": "Custom animation class found"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.update-button",
    "required": true,
    "suggestion": "Follow Watson update button design",
    "description": "Ensure proper update button styling"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.collapsible",
    "required": true,
    "suggestion": "Use standard collapsible class",
    "description": "Ensure collapsible matches Watson style"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.flip-card",
    "required": true,
    "suggestion": "Use approved flip card layout",
    "description": "Ensure flip-card markup follows standard"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.dropdown",
    "required": true,
    "suggestion": "Use Watson dropdown style",
    "description": "Dropdown class missing"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.popup-container",
    "required": true,
    "suggestion": "Use standardized popup markup",
    "description": "Popup container missing"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.tree-list",
    "required": true,
    "suggestion": "Use standardized tree list styles",
    "description": "Tree list missing class"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.Htab_tag",
    "required": true,
    "suggestion": "Ensure correct heading tab styles",
    "description": "Missing Htab_tag element"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "@media\\s*\\(max-width:\\s*768px\\)",
    "required": true,
    "suggestion": "Responsive layout must exist",
    "description": "Missing responsive breakpoint"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "@media\\s*\\(forced-colors:\\s*active\\)",
    "required": true,
    "suggestion": "Support high contrast",
    "description": "Missing forced color rules"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.dark-mode",
    "required": true,
    "suggestion": "Support dark mode",
    "description": "Dark mode class missing"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.pulsing_button",
    "required": true,
    "suggestion": "Avoid excessive motion, include prefers-reduced-motion",
    "description": "Check pulsing animation compliance"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.update-button:focus",
    "required": true,
    "suggestion": "Focus outline must be visible",
    "description": "Missing focus state for button"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "style\\s*=\\s*['\\\"][^'\\\"]*(background|color|padding|margin|font)[^'\\\"]*['\\\"]",
    "required": false,
    "suggestion": "Move inline styles to CSS",
    "description": "Inline style found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "style\\s*=\\s*['\\\"][^'\\\"]*!important[^'\\\"]*['\\\"]",
    "required": false,
    "suggestion": "Avoid !important inline styles",
    "description": "Inline override found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<[^>]*class\\s*=\\s*['\\\"][^'\\\"]*(button--|update-button|animated_button)[^'\\\"]*['\\\"].*style=",
    "required": false,
    "suggestion": "Do not override button styles inline",
    "description": "Inline override on Watson button"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "on(click|mouseover|keydown|submit)=",
    "required": false,
    "suggestion": "Move event handlers to JS",
    "description": "Inline event found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<script[^>]*src=['\\\"]http:",
    "required": false,
    "suggestion": "Use HTTPS for scripts",
    "description": "Insecure script link"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<script[^>]*>[^<]*(alert|prompt|confirm)\\(.*\\)[^<]*</script>",
    "required": false,
    "suggestion": "Remove debug alerts",
    "description": "Debug JS found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<h1[^>]*>.*?</h1>",
    "required": true,
    "suggestion": "Include one <h1>",
    "description": "Missing or multiple H1"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<h2[^>]*>.*?</h2>",
    "required": true,
    "suggestion": "Use <h2> for sections",
    "description": "Missing section heading"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<br\\s*/?>\\s*<br\\s*/?>",
    "required": false,
    "suggestion": "Use CSS margin for spacing",
    "description": "Multiple <br> tags found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<img[^>]*width=['\\\"][0-9]+['\\\"][^>]*height=['\\\"][0-9]+['\\\"]?",
    "required": false,
    "suggestion": "Use CSS for sizing",
    "description": "Hardcoded image dimensions"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<video(?![^>]*aria-label)(?![^>]*title)[^>]*>",
    "required": false,
    "suggestion": "Add aria-label to describe video",
    "description": "Video missing label"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<audio(?![^>]*aria-label)(?![^>]*title)[^>]*>",
    "required": false,
    "suggestion": "Add aria-label to describe audio",
    "description": "Audio missing label"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<meta\\s+http-equiv=['\\\"]refresh['\\\"]",
    "required": false,
    "suggestion": "Avoid meta refresh redirects",
    "description": "Meta refresh detected"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<a[^>]*>[\\s]*click here[\\s]*</a>",
    "required": false,
    "suggestion": "Use descriptive link text",
    "description": "Generic link text found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<a[^>]*target=['\\\"]_blank['\\\"](?![^>]*aria-label)",
    "required": false,
    "suggestion": "Add aria-label '(opens in new window)'",
    "description": "Missing accessibility notice on external link"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*id=['\\\"]TOCRight['\\\"]?",
    "required": true,
    "suggestion": "Ensure floating TOC element exists",
    "description": "Missing floating TOC"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "#s4-[a-zA-Z0-9\\-_]+\\s*\\{[^}]*display\\s*:\\s*none",
    "required": true,
    "suggestion": "Do not modify visibility of SharePoint s4 elements",
    "description": "SharePoint native s4 element visibility modified"
  },
  {
    "category": "css",
    "checkType": "forbidden_selector",
    "pattern": "#s4-[a-zA-Z0-9\\-_]+",
    "required": true,
    "suggestion": "Avoid targeting SharePoint native configuration elements",
    "description": "CSS targeting SharePoint s4 elements"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "\\.s4-[a-zA-Z0-9\\-_]+",
    "required": true,
    "suggestion": "Do not modify SharePoint s4 class elements",
    "description": "CSS targeting SharePoint s4 class elements"
  },
  {
    "category": "html",
    "checkType": "required_tag",
    "pattern": "<div class=\"WatsonSOPBody\">",
    "required": true,
    "suggestion": "Wrap all SOP content in WatsonSOPBody div",
    "description": "Missing WatsonSOPBody wrapper"
  },
  {
    "category": "css",
    "checkType": "required_property",
    "pattern": "\\.WatsonSOPBody\\s*\\{[^}]*margin-left\\s*:\\s*30px",
    "required": true,
    "suggestion": "Use standard 30px left margin in WatsonSOPBody",
    "description": "Non-standard left margin in WatsonSOPBody"
  },
  {
    "category": "css",
    "checkType": "required_property",
    "pattern": "\\.WatsonSOPBody\\s*\\{[^}]*max-width\\s*:\\s*85%",
    "required": true,
    "suggestion": "Use max-width: 85% for responsive design",
    "description": "Non-standard max-width in WatsonSOPBody"
  },
  {
    "category": "css",
    "checkType": "required_property",
    "pattern": "font-family\\s*:\\s*[\"\\']?Amazon Ember[\"\\']?",
    "required": true,
    "suggestion": "Use Amazon Ember as primary font",
    "description": "Amazon Ember font not set as primary"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<h1>.*?</h1>.*?<h3>",
    "required": false,
    "suggestion": "Use h2 before h3; maintain heading hierarchy",
    "description": "Heading hierarchy violated (h1 to h3 skip)"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<h2>.*?</h2>.*?<h4>",
    "required": false,
    "suggestion": "Use h3 before h4; maintain heading hierarchy",
    "description": "Heading hierarchy violated (h2 to h4 skip)"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table(?![^>]*class=)",
    "required": false,
    "suggestion": "Apply table style class",
    "description": "Missing table class"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<img(?![^>]*class=)",
    "required": false,
    "suggestion": "Apply image class ",
    "description": "Missing image class"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<strong(?![^>]*class=[\"\\']ui[\"\\'])[^>]*>(?:Click|Select|Choose|Press)",
    "required": false,
    "suggestion": "Use class=\"ui\" for UI elements users interact with",
    "description": "UI element missing .ui class"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "\\$\\?![^<]*</span>",
    "required": false,
    "suggestion": "Wrap tokens/placeholders in <span class=\"token\">",
    "description": "Token/placeholder missing .token class"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<strong(?![^>]*class=[\"\\']blurb[\"\\'])'",
    "required": false,
    "suggestion": "Use class=\"blurb\" for CTCM blurbs",
    "description": "Blurb missing .blurb class"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<strong(?![^>]*class=[\"\\']queue[\"\\'])'",
    "required": false,
    "suggestion": "Use class=\"queue\" for queue names users interact with",
    "description": "Queue element missing .queue class"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div class=\"(note|warning|important|tip|example|exception|bestPractice|annotation|script|template)\"(?![^>]*role=)",
    "required": false,
    "suggestion": "Add role and aria attributes to call-outs for accessibility",
    "description": "Call-out missing accessibility attributes"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"tab\"(?![^>]*role=\"tablist\")",
    "required": false,
    "suggestion": "Add role=\"tablist\" to tab containers",
    "description": "Tab container missing tablist role"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<b>",
    "required": false,
    "suggestion": "Use <strong> instead of <b> for semantic HTML",
    "description": "Non-semantic <b> tag used"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<i>",
    "required": false,
    "suggestion": "Use <em> instead of <i> for semantic HTML",
    "description": "Non-semantic <i> tag used"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*id=\"toc\"(?![^>]*role=\"navigation\")",
    "required": false,
    "suggestion": "Add role=\"navigation\" and aria-label to TOC",
    "description": "TOC missing navigation role"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "[^\\x00-\\x7F]{10}(?![^<]*xml:lang=)(?![^<]*lang=)",
    "required": false,
    "suggestion": "Use lang or xml:lang attribute for non-English content",
    "description": "Non-English content missing language attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<span class=\"propernoun\">",
    "required": false,
    "suggestion": "Use .propernoun class for proper nouns to avoid Acrolinx flags",
    "description": "Proper noun class usage for capitalization"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<span class=\"tool\">",
    "required": false,
    "suggestion": "Use .tool class for investigation tools",
    "description": "Tool class for investigation tools"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<(acronym|abbr)(?![^>]*title=)",
    "required": false,
    "suggestion": "Add title attribute to acronyms and abbreviations",
    "description": "Acronym/abbreviation missing title attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table[^>]*>(?![^<]*<th)",
    "required": false,
    "suggestion": "Use layout grid (LayoutContainerHorizontal) instead of tables for layout",
    "description": "Table used for layout instead of data"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<(ul|ol)>\\s*<li class=\"(DO|DO_NOT)\">",
    "required": false,
    "suggestion": "Use DO/DO_NOT classes for important reminders list",
    "description": "Important reminders list structure"
  },
  {
    "category": "html",
    "checkType": "required_tag",
    "pattern": "<div id=\"WatsonSOPSource\">",
    "required": true,
    "suggestion": "Include WatsonSOPSource div with SOP URL for version history",
    "description": "Missing version history URL element"
  },
  {
    "category": "css",
    "checkType": "required_property",
    "pattern": "margin-right\\s*:\\s*15%",
    "required": true,
    "suggestion": "Use 15% right margin for responsive design",
    "description": "Non-standard right margin"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"dataTable\"",
    "required": false,
    "suggestion": "Use dataTable class for filterable tables",
    "description": "Filterable table structure"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"(blue|orange|grey|ink)\"(?![^>]*<span[^>]*class=\"visually-hidden\")",
    "required": false,
    "suggestion": "Add visually-hidden span for colored margins to describe content to screen readers",
    "description": "Colored margin missing screen reader description"
  },
  {
    "category": "html",
    "checkType": "required_tag",
    "pattern": "<div class=\"row\">",
    "required": true,
    "suggestion": "Floating TOC requires row container wrapper",
    "description": "Missing row container for floating TOC layout"
  },
  {
    "category": "html",
    "checkType": "required_tag",
    "pattern": "<div id=\"col-TOC\">",
    "required": true,
    "suggestion": "Floating TOC requires col-TOC container",
    "description": "Missing col-TOC container for floating TOC"
  },
  {
    "category": "html",
    "checkType": "required_tag",
    "pattern": "<div class=\"sticky\">",
    "required": true,
    "suggestion": "Floating TOC requires sticky div inside col-TOC",
    "description": "Missing sticky property for floating TOC"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"col-TOC\">\\s*<div class=\"sticky\">\\s*<div id=\"toc\"",
    "required": true,
    "suggestion": "Floating TOC structure must be: col-TOC > sticky > toc",
    "description": "Incorrect nesting order for floating TOC elements"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"toc\"[^>]*>\\s*</div>\\s*</div>\\s*</div>\\s*<div id=\"col-body\">",
    "required": true,
    "suggestion": "Floating TOC must be followed by col-body div",
    "description": "Missing col-body div after floating TOC structure"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"toc\"(?![^>]*role=\"navigation\")",
    "required": false,
    "suggestion": "Add role=\"navigation\" to floating TOC",
    "description": "Floating TOC missing navigation role"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"toc\"(?![^>]*aria-label)",
    "required": false,
    "suggestion": "Add aria-label to floating TOC",
    "description": "Floating TOC missing aria-label attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"toc\"(?![^>]*tabindex=\"0\")",
    "required": false,
    "suggestion": "Add tabindex=\"0\" to floating TOC for keyboard access",
    "description": "Floating TOC missing tabindex attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"toc\"[^>]*>(?!.*<span class=\"sr-only\">)",
    "required": false,
    "suggestion": "Add screen reader description to floating TOC",
    "description": "Floating TOC missing screen reader description"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div class=\"WatsonSOPBody\">\\s*<div class=\"row\">(?!.*<div id=\"col-TOC\">)",
    "required": false,
    "suggestion": "Row container should contain col-TOC for floating TOC",
    "description": "Row container missing col-TOC structure"
  },
  {
    "category": "html",
    "checkType": "required_tag",
    "pattern": "<div id=\"TOCRight\">",
    "required": true,
    "suggestion": "Right-side floating TOC requires TOCRight container",
    "description": "Missing TOCRight container"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"TOCRight\">\\s*<div id=\"full\">",
    "required": true,
    "suggestion": "TOCRight must contain nested full div",
    "description": "Incorrect structure for right-side floating TOC"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"TOCRight\"(?![^>]*role=\"navigation\")",
    "required": false,
    "suggestion": "Add role=\"navigation\" to right-side TOC",
    "description": "Right-side TOC missing navigation role"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"TOCRight\"(?![^>]*aria-label)",
    "required": false,
    "suggestion": "Add aria-label to right-side TOC",
    "description": "Right-side TOC missing aria-label attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"TOCRight\"(?![^>]*tabindex=\"0\")",
    "required": false,
    "suggestion": "Add tabindex=\"0\" to right-side TOC",
    "description": "Right-side TOC missing tabindex attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"TOCRight\"[^>]*>(?!.*<span class=\"sr-only\">)",
    "required": false,
    "suggestion": "Add screen reader instructions to right-side TOC",
    "description": "Right-side TOC missing screen reader instructions"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"toc\"[^>]*>(?!.*<(ul|ol|p))",
    "required": false,
    "suggestion": "TOC should contain list or paragraph elements",
    "description": "Empty or improperly structured TOC"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"toc\"[^>]*>.*(<li>.*</li>.*){16}",
    "required": false,
    "suggestion": "TOC contains more than 15 items",
    "description": "Consider reorganizing your TOC structure"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div id=\"col-TOC\">.*<div id=\"col-body\">(?!.*</div>\\s*</div>\\s*</div>)",
    "required": false,
    "suggestion": "Ensure proper closing tags for row and WatsonSOPBody",
    "description": "Incomplete closing structure for floating TOC layout"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table(?![^>]*>[\\s\\S]*?<th)",
    "required": false,
    "suggestion": "Add header row with <th> elements to tables",
    "description": "Table missing header row"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table(?![^>]*>[\\s\\S]*?<caption)",
    "required": false,
    "suggestion": "Add <caption> element to describe table purpose",
    "description": "Table missing caption for accessibility"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<th(?![^>]*scope=)",
    "required": false,
    "suggestion": "Add scope=\"col\" or scope=\"row\" to table headers",
    "description": "Table header missing scope attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table[^>]*class=\"(WhiteTable|Grey_2_tone|KeyTermsTable|DefinitionTable)\"",
    "required": true,
    "suggestion": "Apply one of the standard table style classes",
    "description": "Table must use approved style class"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<ol[^>]*start=",
    "required": false,
    "suggestion": "Remove start attribute unless required for specific numbering",
    "description": "Ordered list has start attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<ol[^>]*type=",
    "required": false,
    "suggestion": "Remove type attribute; use CSS for list styling",
    "description": "Ordered list has type attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<li[^>]*value=",
    "required": false,
    "suggestion": "Remove value attribute from list items",
    "description": "List item has value attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<iframe(?![^>]*sandbox=)",
    "required": true,
    "suggestion": "Add sandbox attribute with appropriate permissions",
    "description": "Iframe missing sandbox attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<iframe[^>]*sandbox=\"\"",
    "required": false,
    "suggestion": "Specify sandbox permissions: allow-same-origin allow-scripts allow-popups allow-forms",
    "description": "Iframe has empty sandbox attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<iframe(?![^>]*title=)",
    "required": true,
    "suggestion": "Add title attribute to describe iframe content",
    "description": "Iframe missing title attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<iframe[^>]*width=\"\\d+px\"",
    "required": false,
    "suggestion": "Use percentage width (e.g., width=\"100%\") for responsive design",
    "description": "Iframe has fixed pixel width"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<img(?![^>]*class=)[^>]*src=\"[^\"]*\\.(png|jpg|jpeg|gif)\"",
    "required": true,
    "suggestion": "Apply image class (flag, icon, tiny, flowchart, no_border, or zoom)",
    "description": "Image missing required style class"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<img(?![^>]*alt=)",
    "required": true,
    "suggestion": "Add alt attribute with descriptive text (max 160 characters)",
    "description": "Image missing alt attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<img[^>]*alt=\"\"[^>]*>",
    "required": false,
    "suggestion": "Provide descriptive alt text or use decorative image handling",
    "description": "Image has empty alt attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<img[^>]*style=\"[^\"]*border[^\"]*\"",
    "required": false,
    "suggestion": "Remove inline border styles; use CSS classes instead",
    "description": "Image has inline border style"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<img[^>]*width=\"\\d+\"[^>]*height=\"\\d+\"",
    "required": false,
    "suggestion": "Remove fixed dimensions; let CSS handle responsive sizing",
    "description": "Image has hardcoded dimensions"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<img[^>]*class=\"flowchart\"(?![^>]*aria-describedby=)",
    "required": true,
    "suggestion": "Add aria-describedby with detailed flowchart description",
    "description": "Flowchart image missing aria-describedby"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<button(?![^>]*type=)",
    "required": true,
    "suggestion": "Add type=\"button\" or type=\"submit\" to button elements",
    "description": "Button missing type attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<button[^>]*class=\"collapsible\"(?![^>]*aria-expanded=)",
    "required": true,
    "suggestion": "Add aria-expanded=\"false\" to collapsible buttons",
    "description": "Collapsible button missing aria-expanded"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<button[^>]*class=\"collapsible\"(?![^>]*aria-controls=)",
    "required": false,
    "suggestion": "Add aria-controls to reference controlled section ID",
    "description": "Collapsible button missing aria-controls"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<button(?![^>]*aria-label=)(?![^>]*>[^<]+<)",
    "required": false,
    "suggestion": "Add aria-label or visible text content to button",
    "description": "Button missing accessible label"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<button[^>]*class=\"tablinks\"(?![^>]*role=\"tab\")",
    "required": false,
    "suggestion": "Add role=\"tab\" to tab buttons",
    "description": "Tab button missing role attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "class=\"[A-Z]",
    "required": false,
    "suggestion": "Use lowercase with hyphens for class names (e.g., my-class)",
    "description": "Class name uses uppercase (non-standard convention)"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "class=\"[^\"]*\\s{2,}[^\"]*\"",
    "required": false,
    "suggestion": "Remove extra spaces between class names",
    "description": "Multiple spaces in class attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "id=\"[^\"]*\\s[^\"]*\"",
    "required": false,
    "suggestion": "ID attributes cannot contain spaces",
    "description": "ID attribute contains spaces"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<[^>]*class=\"\"[^>]*>",
    "required": false,
    "suggestion": "Remove empty class attributes",
    "description": "Empty class attribute found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<[^>]*id=\"\"[^>]*>",
    "required": false,
    "suggestion": "Remove empty id attributes",
    "description": "Empty id attribute found"
  },
  {
    "category": "html",
    "checkType": "duplicate_check",
    "pattern": "id=\"([^\"]+)\"",
    "required": true,
    "suggestion": "Ensure all ID attributes are unique within the document",
    "description": "Duplicate ID found in document"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<strong[^>]*>(?:Click|Select|Choose|Press|Navigate)(?![^<]*</strong>[^<]*<[^>]*class=\"ui\")",
    "required": false,
    "suggestion": "Add class=\"ui\" to UI interaction elements",
    "description": "UI interaction element missing .ui class"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"(note|warning|important|tip|example|exception|bestPractice|annotation|script|template)\"(?![^>]*role=)",
    "required": true,
    "suggestion": "Add role=\"note\" or role=\"alert\" to call-out divs",
    "description": "Call-out div missing ARIA role"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"(blue|orange|grey|ink)\"(?![^>]*<span[^>]*class=\"visually-hidden\")",
    "required": true,
    "suggestion": "Add visually-hidden span describing the colored section purpose",
    "description": "Colored margin missing screen reader description"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"tab\"(?![^>]*role=\"tablist\")",
    "required": true,
    "suggestion": "Add role=\"tablist\" to tab container",
    "description": "Tab container missing tablist role"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"tabcontent\"(?![^>]*role=\"tabpanel\")",
    "required": true,
    "suggestion": "Add role=\"tabpanel\" to tab content containers",
    "description": "Tab content missing tabpanel role"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<button[^>]*class=\"tablinks\"(?![^>]*aria-selected=)",
    "required": false,
    "suggestion": "Add aria-selected=\"true/false\" to tab buttons",
    "description": "Tab button missing aria-selected"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"flip-card\"(?![^>]*tabindex=)",
    "required": false,
    "suggestion": "Add tabindex=\"0\" to make flip cards keyboard accessible",
    "description": "Flip card missing tabindex for keyboard access"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"flip-card\"(?![^>]*aria-label=)",
    "required": false,
    "suggestion": "Add aria-label describing flip card interaction",
    "description": "Flip card missing aria-label"
  },
  {
    "category": "content_structure",
    "checkType": "percentage_check",
    "pattern": "<div[^>]*class=\"(note|warning|important|tip|example|exception|bestPractice|annotation|script|template)\"[^>]*>[\\s\\S]*?</div>",
    "required": false,
    "suggestion": "Visual callouts exceed 30% of content; consider restructuring to reduce cognitive load",
    "description": "Excessive visual callouts detected (>30% of content)"
  },
  {
    "category": "content_structure",
    "checkType": "percentage_check",
    "pattern": "<table[^>]*>[\\s\\S]*?</table>",
    "required": false,
    "suggestion": "Tables exceed 30% of content; consider using lists or prose for some information",
    "description": "Excessive table usage detected (>30% of content)"
  },
  {
    "category": "content_structure",
    "checkType": "percentage_check",
    "pattern": "<(strong|em|b|i)[^>]*>[^<]+</(strong|em|b|i)>",
    "required": false,
    "suggestion": "Text emphasis exceeds 30% of content; reduce highlighting to maintain effectiveness",
    "description": "Excessive text emphasis detected (>30% of content)"
  },
  {
    "category": "content_structure",
    "checkType": "combined_percentage_check",
    "pattern": "(<div[^>]*class=\"(note|warning|important|tip|example|exception|bestPractice|annotation|script|template)\"[^>]*>[\\s\\S]*?</div>|<table[^>]*>[\\s\\S]*?</table>|<(strong|em|b|i)[^>]*>[^<]+</(strong|em|b|i)>)",
    "required": false,
    "suggestion": "Combined visual elements (callouts, tables, emphasis) exceed 50% of content; restructure for better readability",
    "description": "Excessive combined visual elements detected (>50% of content)"
  },
  {
    "category": "content_structure",
    "checkType": "regex",
    "pattern": "(<div[^>]*class=\"(note|warning|important|tip|example|exception|bestPractice|annotation|script|template)\"[^>]*>[\\s\\S]*?</div>\\s*){3,}",
    "required": false,
    "suggestion": "Three or more consecutive callouts found; consolidate or separate with regular content",
    "description": "Multiple consecutive callouts reduce effectiveness"
  },
  {
    "category": "content_structure",
    "checkType": "regex",
    "pattern": "(<table[^>]*>[\\s\\S]*?</table>\\s*){3,}",
    "required": false,
    "suggestion": "Three or more consecutive tables found; consider consolidating or adding explanatory text",
    "description": "Multiple consecutive tables reduce readability"
  },
  {
    "category": "content_structure",
    "checkType": "ratio_check",
    "pattern": "callout_count / paragraph_count > 0.5",
    "required": false,
    "suggestion": "Callout-to-paragraph ratio exceeds 0.5; too many callouts dilute their impact",
    "description": "High callout-to-content ratio detected"
  },
  {
    "category": "content_structure",
    "checkType": "ratio_check",
    "pattern": "table_count / total_sections > 0.4",
    "required": false,
    "suggestion": "Table-to-section ratio exceeds 0.4; consider alternative content formats",
    "description": "High table-to-section ratio detected"
  },
  {
    "category": "accessibility",
    "checkType": "required_tag",
    "pattern": "<html lang=>",
    "required": true,
    "suggestion": "Add lang=\"en\" to <html> element",
    "description": "Root <html> missing language attribute"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<label(?![^>]*for=)[^>]*>",
    "required": false,
    "suggestion": "Add for=\"id\" matching the input ID",
    "description": "Label missing for= attribute"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<input[^>]*id=['\\\"][^'\\\"]+['\\\"][^>]*>(?![\\s\\S]*<label[^>]*for=['\\\"]\\1['\\\"]>)",
    "required": false,
    "suggestion": "Add matching <label for=\"\"> for each input",
    "description": "Input missing corresponding label"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<input(?![^>]*(aria-label|title|id))[^\\>]*>",
    "required": false,
    "suggestion": "Add aria-label/title or label+id",
    "description": "Form input missing accessible name"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<video(?![^>]*<track[^>]*kind=['\\\"]captions['\\\"])[\\s\\S]*?</video>",
    "required": false,
    "suggestion": "Add <track kind=\"captions\"> for videos",
    "description": "Video missing captions"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<audio(?![^>]*transcript)[\\s\\S]*?</audio>",
    "required": false,
    "suggestion": "Provide transcript for audio content",
    "description": "Audio missing transcript"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<video[^>]*autoplay(?![^>]*muted)",
    "required": false,
    "suggestion": "Autoplay videos must also be muted",
    "description": "Autoplay video without muted attribute"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<audio[^>]*autoplay",
    "required": false,
    "suggestion": "Remove autoplay for audio",
    "description": "Autoplay audio violates accessibility"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<a href=\"#?(?:(?![a-zA-Z0-9_-]).)*\">",
    "required": false,
    "suggestion": "Ensure href anchors point to valid IDs",
    "description": "Invalid internal link anchor"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<div[^>]*tabindex=\"0\"(?![^>]*role=)",
    "required": false,
    "suggestion": "Focusable div missing role attribute non-interactive",
    "description": "Non-interactive element focusable"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<nav(?![^>]*role=\"navigation\")",
    "required": false,
    "suggestion": "Add role=\"navigation\" to nav elements",
    "description": "Missing ARIA role navigation"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<main(?![^>]*role=\"main\")",
    "required": true,
    "suggestion": "Add role=\"main\" to <main> region",
    "description": "Main landmark missing role attribute"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<a class=\"skip-link\"(?![^>]*href=\"#main\")",
    "required": true,
    "suggestion": "Skip to content link must point to #main",
    "description": "Skip-link missing proper target"
  },
  {
    "category": "accessibility",
    "checkType": "regex",
    "pattern": "<a class=\"skip-link\">",
    "required": true,
    "suggestion": "Add skip-link to top of page",
    "description": "Missing skip-link for keyboard users"
  },
  {
    "category": "html",
    "checkType": "required_tag",
    "pattern": "<meta charset=\"UTF-8\">",
    "required": true,
    "suggestion": "Add <meta charset=\"UTF-8\"> to document head",
    "description": "Missing charset declaration"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<html(?![^>]*lang=)",
    "required": true,
    "suggestion": "Add lang=\"en\" to <html> element",
    "description": "Root <html> missing language attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<html[^>]*lang=\"\"[^>]*>",
    "required": false,
    "suggestion": "Specify correct lang attribute value",
    "description": "Empty lang attribute detected"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<h1>[\\s\\S]*?<h1>",
    "required": false,
    "suggestion": "Use only one <h1> per page",
    "description": "Multiple <h1> elements found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<h[3-6]>[\\s\\S]*?<h1>",
    "required": false,
    "suggestion": "Do not place lower headings before <h1>",
    "description": "Heading out of order (content before H1)"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<h[4]>[\\s\\S]*?<h2>",
    "required": false,
    "suggestion": "Do not skip from h2 to h4",
    "description": "Heading hierarchy violation (h2\u2192h4)"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<h[5]>[\\s\\S]*?<h3>",
    "required": false,
    "suggestion": "Do not skip from h3 to h5",
    "description": "Heading hierarchy violation (h3\u2192h5)"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<h[6]>[\\s\\S]*?<h4>",
    "required": false,
    "suggestion": "Do not skip from h4 to h6",
    "description": "Heading hierarchy violation (h4\u2192h6)"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<h[2-6]>[\\s\\S]*?<h1>",
    "required": false,
    "suggestion": "H1 must appear before all other headings",
    "description": "H1 missing or placed too late"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<hr[^>]*>",
    "required": false,
    "suggestion": "Avoid using <hr>; use CSS borders instead",
    "description": "Non-semantic horizontal rule detected"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<header>(?![\\s\\S]*?<h1>)",
    "required": false,
    "suggestion": "Header must contain an <h1> element",
    "description": "Header missing page title"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<section>[\\s\\S]*?</section>(?![\\s\\S]*?<h2>)",
    "required": false,
    "suggestion": "Each section should begin with an <h2> heading",
    "description": "Section missing proper heading structure"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<article>[\\s\\S]*?</article>(?![\\s\\S]*?<h2>)",
    "required": false,
    "suggestion": "Article content requires heading",
    "description": "H2 missing from article"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<footer>(?![\\s\\S]*?copyright)",
    "required": false,
    "suggestion": "Include copyright statement in footer",
    "description": "Footer missing copyright text"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table(?![^>]*summary=)(?![^>]*caption)",
    "required": false,
    "suggestion": "Add caption or summary describing table content",
    "description": "Table missing caption and summary"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"container\"(?![^>]*role=)",
    "required": false,
    "suggestion": "Add role=\"region\" or semantic element instead of generic container",
    "description": "Container div missing ARIA role"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<a href=\"#[^\"]+\">(?![\\s\\S]*id=\"[^\"]+\")",
    "required": false,
    "suggestion": "Ensure internal links reference existing IDs",
    "description": "Broken internal anchor reference"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<a[^>]*href=\"\"[^>]*>",
    "required": false,
    "suggestion": "Empty href attributes must be removed",
    "description": "Empty hyperlink reference"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<a[^>]*href=\"[^\"]*\"(?![^>]*rel=\"noopener\")",
    "required": false,
    "suggestion": "Add rel=\"noopener\" for links with target=\"_blank\"",
    "description": "Missing rel=\"noopener\" attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<a[^>]*href=\" \">",
    "required": false,
    "suggestion": "Whitespace-only href attribute",
    "description": "Invalid href attribute"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table[^>]*>\\s*<tr[^>]*>\\s*</tr>",
    "required": false,
    "suggestion": "Avoid empty table rows",
    "description": "Empty table row detected"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table[^>]*>\\s*<tr[^>]*>\\s*<td[^>]*>\\s*</td>",
    "required": false,
    "suggestion": "Avoid empty table cells",
    "description": "Empty table cell detected"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<table[^>]*>\\s*(?![\\s\\S]*?<tr)",
    "required": false,
    "suggestion": "Table must contain row elements",
    "description": "Table missing rows"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<thead>(?![\\s\\S]*?</thead>)",
    "required": false,
    "suggestion": "Ensure proper <thead> structure",
    "description": "Malformed thead element"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<ul[^>]*class=\"numbers\">",
    "required": false,
    "suggestion": "Do not use custom numbered list classes; use <ol>",
    "description": "Improper list type (numbers class misuse)"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<ul[^>]*style=",
    "required": false,
    "suggestion": "Remove inline styles from unordered lists",
    "description": "Inline style applied to list element"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<ol[^>]*style=",
    "required": false,
    "suggestion": "Remove inline styles from ordered lists",
    "description": "Inline style applied to ordered list"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<td[^>]*colspan=\"1\"",
    "required": false,
    "suggestion": "Avoid unnecessary colspan=\"1\" attributes",
    "description": "Redundant colspan value"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<td[^>]*rowspan=\"1\"",
    "required": false,
    "suggestion": "Avoid unnecessary rowspan=\"1\" attributes",
    "description": "Redundant rowspan value"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*style=\"[^\"]*text-indent",
    "required": false,
    "suggestion": "Use CSS classes instead of inline text indentation",
    "description": "Inline text-indent styling found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*style=\"[^\"]*(left|right):\\s*\\d+px",
    "required": false,
    "suggestion": "Do not position layout using inline left/right offsets",
    "description": "Inline positional offset detected"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*data-[a-zA-Z-]+=",
    "required": false,
    "suggestion": "Remove unapproved data-* attributes",
    "description": "Unauthorized data attribute found"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"ms-rtestate-field\"",
    "required": false,
    "suggestion": "Remove SharePoint editing markup",
    "description": "SharePoint ms-rtestate-field wrapper present"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<o:p>",
    "required": false,
    "suggestion": "Remove MS Office O:P tags",
    "description": "Detected Microsoft Office markup"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "mso-[a-zA-Z-]+:",
    "required": false,
    "suggestion": "Remove MS Office mso-* inline styles",
    "description": "Microsoft Word styling detected"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<span[^>]*style=\"[^\"]*mso-",
    "required": false,
    "suggestion": "Remove pasted MS Office formatting",
    "description": "MSO inline formatting detected"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<style[^>]*>(?![\\s\\S]*@media)",
    "required": false,
    "suggestion": "Move inline <style> blocks to CSS files",
    "description": "Inline style block detected in content"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<style>[\\s\\S]*</style>",
    "required": false,
    "suggestion": "Do not include <style> in the content body",
    "description": "Style tags must not appear in content region"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<meta[^>]*http-equiv=['\\\"]x-ua-compatible['\\\"]",
    "required": false,
    "suggestion": "Remove legacy compatibility meta tags",
    "description": "Deprecated IE compatibility meta tag"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<meta[^>]*http-equiv=['\\\"]pragma['\\\"]",
    "required": false,
    "suggestion": "Remove pragma no-cache meta usage",
    "description": "Deprecated pragma meta tag"
  },
  {
    "category": "html",
    "checkType": "regex",
    "pattern": "<script(?![^>]*src=)[^>]*>",
    "required": false,
    "suggestion": "Do not include inline <script> tags in content",
    "description": "Inline script tag found"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})",
    "required": false,
    "suggestion": "Use Watson brand color variables instead of hex codes",
    "description": "Hard-coded hex color value detected"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "rgb\\([^)]*\\)",
    "required": false,
    "suggestion": "Use Watson brand color variables instead of rgb()",
    "description": "Hard-coded rgb() color detected"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "hsl\\([^)]*\\)",
    "required": false,
    "suggestion": "Use Watson brand color variables instead of hsl()",
    "description": "Hard-coded hsl() color detected"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "font-family\\s*:\\s*(Arial|Calibri|Times New Roman|Roboto|Segoe UI)",
    "required": true,
    "suggestion": "Use Amazon Ember as the approved font",
    "description": "Non-approved font family detected"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "font\\s*:\\s*[^;]*\\bArial\\b",
    "required": true,
    "suggestion": "Remove MS Word default font formatting",
    "description": "MS Word font usage detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "[0-9]+px",
    "required": true,
    "suggestion": "Use relative units ",
    "description": "Fixed pixel value used where not permitted"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "margin-(left|right|top|bottom)\\s*:\\s*\\d+px",
    "required": false,
    "suggestion": "Use CSS layout classes instead of fixed margins",
    "description": "Fixed margin detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "padding-(left|right|top|bottom)\\s*:\\s*\\d+px",
    "required": false,
    "suggestion": "Use CSS spacing utilities instead of fixed padding",
    "description": "Fixed padding detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "width\\s*:\\s*\\d+px",
    "required": false,
    "suggestion": "Use responsive width values (%auto)",
    "description": "Fixed width detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "height\\s*:\\s*\\d+px",
    "required": false,
    "suggestion": "Avoid fixed heights; use min-height or auto",
    "description": "Fixed height detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "position\\s*:\\s*absolute",
    "required": true,
    "suggestion": "Avoid absolute positioning unless essential",
    "description": "Absolute positioning may break layout"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "position\\s*:\\s*fixed",
    "required": false,
    "suggestion": "Avoid fixed positioning in SOP content",
    "description": "Fixed positioning detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "top\\s*:\\s*\\d+px|left\\s*:\\s*\\d+px|right\\s*:\\s*\\d+px|bottom\\s*:\\s*\\d+px",
    "required": false,
    "suggestion": "Do not manually place elements using offsets",
    "description": "Manual offset positioning detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "transition\\s*:\\s*[^;]*(?<!none)",
    "required": true,
    "suggestion": "Ensure transitions include prefers-reduced-motion",
    "description": "Transition animation missing reduced-motion fallback"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "animation\\s*:\\s*(?!none)[^;]*",
    "required": true,
    "suggestion": "Ensure animations include prefers-reduced-motion",
    "description": "Animation missing reduced-motion compliance"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "@keyframes",
    "required": true,
    "suggestion": "Verify keyframes also support reduced motion",
    "description": "Motion keyframes detected; check compliance"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "filter\\s*:\\s*blur",
    "required": false,
    "suggestion": "Blur effects reduce readability",
    "description": "Blur CSS filter detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "opacity\\s*:\\s*0(\\.\\d+)?",
    "required": false,
    "suggestion": "Do not hide content visually; use aria-hidden if appropriate",
    "description": "Opacity used to hide elements"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "box-shadow\\s*:\\s*[^;]*0\\s+0\\s+0",
    "required": false,
    "suggestion": "Use meaningful shadows or remove entirely",
    "description": "Zero-value shadow detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "text-shadow\\s*:\\s*[^;]*",
    "required": false,
    "suggestion": "Avoid text-shadow; reduces accessibility",
    "description": "Text shadow detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "display\\s*:\\s*table",
    "required": true,
    "suggestion": "Use layout grid classes instead of CSS display:table",
    "description": "Table-based layout CSS detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "display\\s*:\\s*table-cell",
    "required": true,
    "suggestion": "Use flex/grid instead of table cells",
    "description": "Table-cell CSS layout detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "overflow\\s*:\\s*hidden",
    "required": true,
    "suggestion": "Ensure focus outlines are not clipped",
    "description": "Overflow hidden may clip focus outlines"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "overflow-x\\s*:\\s*scroll",
    "required": true,
    "suggestion": "Avoid horizontal scrolling in SOP content",
    "description": "Horizontal scroll detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "overflow-y\\s*:\\s*scroll",
    "required": false,
    "suggestion": "Verify content container is intended for scrolling",
    "description": "Vertical scroll container detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "background-image\\s*:\\s*url",
    "required": true,
    "suggestion": "Background images should not be used in SOP content",
    "description": "Background image detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "cursor\\s*:\\s*(wait|progress|none)",
    "required": false,
    "suggestion": "Do not override default cursors",
    "description": "CSS cursor override detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "mso-[a-zA-Z-]+:",
    "required": true,
    "suggestion": "Remove Microsoft Office CSS artifacts",
    "description": "MS Word styling found in CSS"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "webkit-margin",
    "required": true,
    "suggestion": "Remove browser-specific pasted formatting",
    "description": "Copy-paste vendor CSS detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "ms-grid",
    "required": true,
    "suggestion": "Avoid legacy MS grid syntax",
    "description": "Deprecated Microsoft grid detected"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.dark-mode[^}]*color\\s*:\\s*(white|#fff)",
    "required": true,
    "suggestion": "Ensure dark-mode text has sufficient contrast",
    "description": "Dark-mode text color too light"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.dark-mode[^}]*background[^}]*:\\s*(black|#000)",
    "required": true,
    "suggestion": "Ensure dark-mode backgrounds meet contrast standards",
    "description": "Dark-mode background too dark without contrast balancing"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "\\.dark-mode(?![^}]*--)",
    "required": false,
    "suggestion": "Ensure dark-mode uses CSS variables",
    "description": "Dark-mode class missing CSS variable usage"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "@media\\s*\\(min-width:\\s*1024px\\)",
    "required": true,
    "suggestion": "Ensure layout supports large screens",
    "description": "Missing large-screen breakpoint"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "@media\\s*\\(max-width:\\s*480px\\)",
    "required": true,
    "suggestion": "Ensure layout supports mobile devices",
    "description": "Missing mobile breakpoint"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "grid-template-columns\\s*:\\s*repeat\\(11fr\\)",
    "required": false,
    "suggestion": "Ensure multi-column layouts where appropriate",
    "description": "Grid using single column unnecessarily"
  },
  {
    "category": "css",
    "checkType": "regex",
    "pattern": "flex-direction\\s*:\\s*column(?![^}]*@media)",
    "required": true,
    "suggestion": "Ensure vertical flex layouts have responsive breakpoints",
    "description": "Column flex layout missing responsive variant"
  },
  {
    "category": "css",
    "checkType": "forbidden_property",
    "pattern": "z-index\\s*:\\s*(1[0-9]{2}|[2-9][0-9]{2})",
    "required": true,
    "suggestion": "Keep z-index below 100 to avoid stacking issues",
    "description": "Excessive z-index detected"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<button[^>]*aria-controls=['\\\"]([^'\\\"]+)['\\\"](?![\\s\\S]*id=['\\\"]\\1['\\\"])",
    "required": false,
    "suggestion": "Ensure aria-controls target ID exists",
    "description": "aria-controls references a missing ID"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "id=['\\\"]([^'\\\"]+)['\\\"](?![\\s\\S]*aria-controls=['\\\"]\\1['\\\"])",
    "required": false,
    "suggestion": "Ensure all collapsible regions are controlled by a button",
    "description": "Region missing corresponding controls"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<button(?![^>]*role=['\\\"]button['\\\"])",
    "required": true,
    "suggestion": "Add role=\"button\" or <button> element for clickable items",
    "description": "Clickable element missing button role"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "(<div[^>]*role=['\\\"]button['\\\"])(?![^>]*tabindex=\"0\")",
    "required": true,
    "suggestion": "Add tabindex=\"0\" to role=\"button\" items",
    "description": "Div button missing keyboard focusability"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "role=['\\\"]button['\\\"](?![\\s\\S]*onkeydown)",
    "required": true,
    "suggestion": "Add keyboard handlers for Space/Enter",
    "description": "Custom button missing keyboard activation"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<button[^>]*class=\"collapsible\"(?![^>]*aria-expanded=)",
    "required": true,
    "suggestion": "Add aria-expanded to collapsible buttons",
    "description": "Collapsible missing expanded state"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<button[^>]*class=\"collapsible\"(?![^>]*aria-controls=)",
    "required": true,
    "suggestion": "Add aria-controls referencing controlled panel",
    "description": "Collapsible missing aria-controls"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"collapsible-content\"(?![^>]*id=)",
    "required": true,
    "suggestion": "Add unique ID for collapsible content",
    "description": "Collapsible content missing ID"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<button[^>]*class=\"collapsible\"[^>]*aria-controls=['\\\"]([^'\\\"]+)['\\\"]>(?![\\s\\S]*?<div[^>]*id=['\\\"]\\1['\\\"])",
    "required": true,
    "suggestion": "aria-controls must match collapsible panel ID",
    "description": "Mismatched aria-controls/ID binding"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*role=['\\\"]tablist['\\\"](?![^>]*aria-orientation)",
    "required": true,
    "suggestion": "Add aria-orientation=\"horizontal\" or \"vertical\"",
    "description": "Tablist missing orientation"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<button[^>]*class=\"tablinks\"(?![^>]*role=['\\\"]tab['\\\"])",
    "required": true,
    "suggestion": "Add role=\"tab\" to tab buttons",
    "description": "Tab button missing tab role"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<button[^>]*role=['\\\"]tab['\\\"](?![^>]*aria-selected)",
    "required": true,
    "suggestion": "Add aria-selected=\"true/false\" to tabs",
    "description": "Tab missing aria-selected state"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"tabcontent\"(?![^>]*role=['\\\"]tabpanel['\\\"])",
    "required": true,
    "suggestion": "Add role=\"tabpanel\" to tab panels",
    "description": "Tab content missing panel role"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "role=['\\\"]tab['\\\"](?![\\s\\S]*id=)",
    "required": true,
    "suggestion": "Add unique ID for each tab",
    "description": "Tab requires unique ID"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "role=['\\\"]tabpanel['\\\"](?![\\s\\S]*aria-labelledby=)",
    "required": true,
    "suggestion": "Each tabpanel needs aria-labelledby",
    "description": "Tabpanel missing label linkage"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<button[^>]*role=['\\\"]tab['\\\"](?![^>]*aria-controls)",
    "required": true,
    "suggestion": "Add aria-controls to tabs to link to associated panel",
    "description": "Tab missing aria-controls"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*role=['\\\"]dialog['\\\"](?![^>]*aria-modal=)",
    "required": true,
    "suggestion": "Add aria-modal=\"true\" to dialogs",
    "description": "Dialog missing modal attribute"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*role=['\\\"]dialog['\\\"](?![^>]*aria-labelledby=)",
    "required": true,
    "suggestion": "Add aria-labelledby referencing dialog title",
    "description": "Dialog missing label"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*role=['\\\"]dialog['\\\"](?![^>]*tabindex=\"0\")",
    "required": true,
    "suggestion": "Make dialog focusable for trapping",
    "description": "Dialog missing focusability"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*role=['\\\"]dialog['\\\"](?![\\s\\S]*close)",
    "required": false,
    "suggestion": "Ensure dialog has visible close control",
    "description": "Dialog missing close control"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*role=['\\\"]dialog['\\\"](?![\\s\\S]*<button[^>]*class=\"close\")",
    "required": false,
    "suggestion": "Dialogs must include a close button",
    "description": "Dialog close button missing"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"tooltip\"(?![^>]*role=\"tooltip\")",
    "required": true,
    "suggestion": "Add role=\"tooltip\" for tooltips",
    "description": "Tooltip missing ARIA role"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*role=['\\\"]tooltip['\\\"](?![^>]*id=)",
    "required": true,
    "suggestion": "Add unique ID to tooltip",
    "description": "Tooltip missing ID"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "aria-describedby=['\\\"]([^'\\\"]+)['\\\"](?![\\s\\S]*id=['\\\"]\\1['\\\"])",
    "required": false,
    "suggestion": "aria-describedby must reference a real element",
    "description": "Broken aria-describedby reference"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "role=['\\\"]dialog['\\\"](?![\\s\\S]*tabindex)",
    "required": true,
    "suggestion": "Dialog elements must trap focus",
    "description": "Dialog missing focus trap capability"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"modal\"(?![^>]*role=['\\\"]dialog['\\\"])",
    "required": true,
    "suggestion": "Modal containers must use role=\"dialog\"",
    "description": "Modal missing dialog role"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"flip-card\"(?![^>]*tabindex=\"0\")",
    "required": true,
    "suggestion": "Make flip-cards keyboard accessible",
    "description": "Flip card missing tabindex"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"flip-card\"(?![^>]*aria-label=)",
    "required": true,
    "suggestion": "Add aria-label describing interactive nature",
    "description": "Flip card missing aria-label"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*class=\"flip-card\"(?![\\s\\S]*onkeydown)",
    "required": false,
    "suggestion": "Add keyboard arrow/Enter support for flip cards",
    "description": "Flip card missing keyboard interaction"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<button[^>]*(onclick|onmouseover|onfocus)=",
    "required": false,
    "suggestion": "Move inline event handlers to JS files",
    "description": "Inline event handler detected"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<div[^>]*(onclick|onmouseover|onkeydown)=",
    "required": false,
    "suggestion": "Avoid inline event handlers on non-interactive elements",
    "description": "Inline event handler on non-interactive element"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "document\\.write",
    "required": true,
    "suggestion": "Avoid using document.write in SOP content",
    "description": "Prohibited JS API detected"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "alert\\(|prompt\\(|confirm\\(",
    "required": false,
    "suggestion": "Remove debug or blocking JS calls",
    "description": "Debug JS calls detected"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "const\\s+[A-Za-z]+\\s*=\\s*document\\.querySelectorAll\\(['\\\"][^'\\\"]+['\\\"]\\)",
    "required": false,
    "suggestion": "Ensure querySelectorAll has a length check before iteration",
    "description": "querySelectorAll used unsafely"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "getElementById\\([^)]*\\)(?![\\s\\S]*addEventListener)",
    "required": false,
    "suggestion": "Ensure elements retrieved by ID have event listeners or logic",
    "description": "Unused DOM reference detected"
  },
  {
    "category": "interactive",
    "checkType": "regex",
    "pattern": "<script(?![^>]*src=)[^>]*>",
    "required": false,
    "suggestion": "Inline script blocks not allowed in body",
    "description": "Inline script block found"
  }
];
})();
