let profileData = null;
let assetBasePath = "./Assets";
let actionStatusTimeout = null;

function resolveAssetPath(path) {
    if (!path) {
        return "";
    }

    if (/^(https?:)?\/\//.test(path) || path.startsWith("./") || path.startsWith("../")) {
        return path;
    }

    return `${assetBasePath}/${path}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

async function loadData() {
    const fallbackNode = document.getElementById("profile-data-fallback");

    if (window.location.protocol === "file:" || !window.fetch) {
        if (!fallbackNode) {
            throw new Error("Embedded profile data not available");
        }
        profileData = JSON.parse(fallbackNode.textContent);
    } else {
        try {
            const response = await fetch("./data.json", { cache: "no-store" });
            if (!response.ok) {
                throw new Error("Unable to load data.json");
            }
            profileData = await response.json();
        } catch (error) {
            if (!fallbackNode) {
                throw error;
            }
            profileData = JSON.parse(fallbackNode.textContent);
        }
    }

    assetBasePath = profileData.assetBasePath || "./Assets";
}

function isPublicHttpUrl(value) {
    if (!value) {
        return false;
    }

    try {
        const parsed = new URL(value, window.location.href);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (error) {
        return false;
    }
}

function getPublicBaseUrl() {
    const candidates = [
        profileData?.publicUrl,
        profileData?.shareHref,
        profileData?.website?.href,
        window.location.protocol === "file:" ? "" : window.location.href
    ];

    return candidates.find((candidate) => isPublicHttpUrl(candidate)) || "";
}

function getPublicAssetUrl(path) {
    if (!path) {
        return "";
    }

    if (isPublicHttpUrl(path)) {
        return path;
    }

    const publicBaseUrl = getPublicBaseUrl();
    if (!publicBaseUrl) {
        return "";
    }

    try {
        return new URL(resolveAssetPath(path), publicBaseUrl).href;
    } catch (error) {
        return "";
    }
}

function toggleVisibility(nodeOrId, shouldShow) {
    const node = typeof nodeOrId === "string" ? document.getElementById(nodeOrId) : nodeOrId;
    if (!node) {
        return;
    }

    node.hidden = !shouldShow;
}

function createContactItem(iconPath, label, href) {
    const item = document.createElement("a");
    item.className = "contact-item";
    item.href = href || "#";

    const icon = document.createElement("img");
    icon.className = "contact-icon";
    icon.src = resolveAssetPath(iconPath);
    icon.alt = "";

    const text = document.createElement("span");
    text.className = "contact-text";
    text.textContent = label || "";

    item.append(icon, text);

    if (/^https?:\/\//i.test(item.href)) {
        item.target = "_blank";
        item.rel = "noreferrer";
    }

    return item;
}

function populateLinks(containerId, items, itemClassName) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    container.innerHTML = "";

    const validItems = (items || []).filter((item) => item?.href && item?.icon);

    validItems.forEach((item) => {
        if (!item?.href || !item?.icon) {
            return;
        }

        const link = document.createElement("a");
        link.className = itemClassName;
        link.href = item.href;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.setAttribute("aria-label", item.label || "");

        const icon = document.createElement("img");
        icon.src = resolveAssetPath(item.icon);
        icon.alt = item.label || "";

        link.appendChild(icon);
        container.appendChild(link);
    });

    toggleVisibility(container, validItems.length > 0);
}

function populateServices(items) {
    const list = document.getElementById("service-list");
    if (!list) {
        return;
    }

    list.innerHTML = "";

    const validItems = (items || []).filter((item) => `${item || ""}`.trim());

    validItems.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
    });

    toggleVisibility(list.closest(".service-section"), validItems.length > 0);
}

function setImage(id, path, alt = "") {
    const node = document.getElementById(id);
    if (!node) {
        return;
    }

    if (!path) {
        toggleVisibility(node, false);
        return;
    }

    node.src = resolveAssetPath(path);
    node.alt = alt;
    toggleVisibility(node, true);
}

function setLink(id, href, text) {
    const node = document.getElementById(id);
    if (!node) {
        return;
    }

    const hasHref = `${href || ""}`.trim();
    const hasText = typeof text === "string" ? text.trim() : "";

    if (!hasHref && !hasText) {
        toggleVisibility(node, false);
        return;
    }

    if (href) {
        node.href = href;
        if (/^https?:\/\//i.test(href)) {
            node.target = "_blank";
            node.rel = "noreferrer";
        } else {
            node.removeAttribute("target");
            node.removeAttribute("rel");
        }
    }

    if (typeof text === "string") {
        node.textContent = text;
    }

    toggleVisibility(node, true);
}

function setStatus(nodeId, message) {
    const statusNode = document.getElementById(nodeId);
    if (!statusNode) {
        return;
    }

    statusNode.textContent = "";

    if (actionStatusTimeout) {
        clearTimeout(actionStatusTimeout);
    }

    actionStatusTimeout = window.setTimeout(() => {
        statusNode.textContent = message;
    }, 20);
}

function triggerDownload(href, filename) {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function getCardUrl() {
    const candidates = [
        profileData?.publicUrl,
        profileData?.website?.href,
        profileData?.shareHref,
        window.location.protocol === "file:" ? "" : window.location.href
    ];

    return candidates.find((candidate) => isPublicHttpUrl(candidate)) || "";
}

function getPlainName() {
    return `${profileData?.officeName || ""}`.replace(/\s+/g, " ").trim() || "Suresh Thirunavukkarasu";
}

function getDigits(value) {
    return `${value || ""}`.replace(/\D+/g, "");
}

function getFirstWhatsappHref() {
    const whatsappSocial = (profileData?.topSocials || []).find((item) => {
        const label = `${item?.label || ""}`.toLowerCase();
        const href = `${item?.href || ""}`.toLowerCase();
        return label.includes("whatsapp") || href.includes("wa.me");
    });

    return whatsappSocial?.href || "";
}

function getExchangeContactHref() {
    const candidates = [
        profileData?.exchangeContactHref,
        getFirstWhatsappHref(),
        profileData?.officePhone?.href,
        profileData?.phones?.[0]?.href,
        profileData?.officeEmail?.href,
        profileData?.email?.href
    ];

    return candidates.find((candidate) => `${candidate || ""}`.trim()) || "";
}

function buildExchangeMessage({ name, mobile, email, company, digitalCard }) {
    return [
        "Hello,",
        "",
        "Sharing my contact details with you:",
        "",
        `Name: ${name}`,
        `Mobile: ${mobile}`,
        `Email: ${email}`,
        `Company Name: ${company || "-"}`,
        `Digital Card: ${digitalCard || "-"}`,
        "",
        "Please share your contact card as well."
    ].join("\n");
}

function getQrCodeUrl() {
    const shareUrl = getCardUrl();
    return shareUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=${encodeURIComponent(shareUrl)}`
        : "";
}

function updateMetaTag(selector, content) {
    const node = document.querySelector(selector);
    if (node && content) {
        node.setAttribute("content", content);
    }
}

function updateSocialMetadata() {
    const pageTitle = profileData?.pageTitle || document.title;
    const pageDescription = profileData?.pageDescription || "";
    const pageUrl = getCardUrl();
    const previewImage = profileData?.previewImagePublicUrl || getPublicAssetUrl(profileData?.previewImage || profileData?.profilePhoto);
    const previewImageAlt = profileData?.previewImageAlt || `${getPlainName()} portrait`;
    const siteName = profileData?.siteName || profileData?.officeName || getPlainName();

    const canonicalLink = document.getElementById("canonical-link");
    if (canonicalLink) {
        if (pageUrl) {
            canonicalLink.href = pageUrl;
        } else {
            canonicalLink.removeAttribute("href");
        }
    }

    updateMetaTag('meta[name="twitter:card"]', "summary_large_image");
    updateMetaTag('meta[property="og:site_name"]', siteName);
    updateMetaTag('meta[property="og:title"]', pageTitle);
    updateMetaTag('meta[property="og:description"]', pageDescription);
    updateMetaTag('meta[property="og:url"]', pageUrl);
    updateMetaTag('meta[property="og:image"]', previewImage);
    updateMetaTag('meta[property="og:image:secure_url"]', previewImage);
    updateMetaTag('meta[property="og:image:type"]', "image/png");
    updateMetaTag('meta[property="og:image:width"]', "630");
    updateMetaTag('meta[property="og:image:height"]', "630");
    updateMetaTag('meta[property="og:image:alt"]', previewImageAlt);
    updateMetaTag('meta[name="twitter:url"]', pageUrl);
    updateMetaTag('meta[name="twitter:title"]', pageTitle);
    updateMetaTag('meta[name="twitter:description"]', pageDescription);
    updateMetaTag('meta[name="twitter:image"]', previewImage);
    updateMetaTag('meta[name="twitter:image:alt"]', previewImageAlt);
}

function openModal(layerId) {
    const layer = document.getElementById(layerId);
    if (!layer) {
        return;
    }

    layer.classList.remove("is-hidden");
    layer.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const focusTarget = layer.querySelector("button, input, a");
    focusTarget?.focus();
}

function closeModal(layer) {
    const targetLayer = typeof layer === "string" ? document.getElementById(layer) : layer;
    if (!targetLayer) {
        return;
    }

    targetLayer.classList.add("is-hidden");
    targetLayer.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal-layer:not(.is-hidden)")) {
        document.body.classList.remove("modal-open");
    }
}

function bindModalDismissals() {
    document.querySelectorAll("[data-close-modal]").forEach((node) => {
        node.addEventListener("click", () => {
            closeModal(node.closest(".modal-layer"));
        });
    });

    window.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        document.querySelectorAll(".modal-layer:not(.is-hidden)").forEach((layer) => {
            closeModal(layer);
        });
    });
}

async function copyCardUrl() {
    const shareUrl = getCardUrl();

    if (!shareUrl) {
        throw new Error("Public card URL not available");
    }

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setStatus("share-modal-status", "Digital card URL copied.");
        return;
    }

    window.prompt("Copy this digital card URL", shareUrl);
}

async function saveContactCard() {
    if (!profileData?.vcardFile) {
        throw new Error("Contact file not available");
    }

    triggerDownload(resolveAssetPath(profileData.vcardFile), `${getPlainName().replace(/\s+/g, "-")}.vcf`);
    setStatus("action-status", "Contact file downloaded.");
    setStatus("share-modal-status", "Contact file downloaded.");
}

function buildShareLinks() {
    const container = document.getElementById("share-modal-links");
    if (!container) {
        return;
    }

    const shareUrl = getCardUrl();
    const shareTitle = profileData?.pageTitle || "Digital Card";
    const shareText = `${getPlainName()} ${shareUrl}`;
    const links = shareUrl ? [
        {
            icon: "whatsapp_icon.svg",
            label: "Share via WhatsApp",
            href: `https://wa.me/?text=${encodeURIComponent(shareText)}`
        },
        {
            icon: "linkedin_icon.svg",
            label: "Share via LinkedIn",
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        },
        {
            icon: "xcom_icon.svg",
            label: "Share via X",
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
        },
        {
            icon: "facebook_icon.svg",
            label: "Share via Facebook",
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        }
    ] : [];

    container.innerHTML = "";

    links.forEach((item) => {
        const link = document.createElement("a");
        link.className = "modal-share-link";
        link.href = item.href;
        link.target = item.href.startsWith("mailto:") ? "_self" : "_blank";
        link.rel = "noreferrer";
        link.setAttribute("aria-label", item.label);

        const icon = document.createElement("img");
        icon.src = resolveAssetPath(item.icon);
        icon.alt = "";

        link.appendChild(icon);
        container.appendChild(link);
    });
}

function populateModals() {
    setImage("share-modal-banner", profileData?.shareBannerImage || "QRCode_Banner.svg", "");
    setImage("share-modal-avatar", profileData?.profilePhoto, `${getPlainName()} portrait`);

    const shareModalTitle = document.getElementById("share-modal-title");
    const shareSubrole = document.getElementById("share-modal-subrole");
    const exchangeCardLink = document.getElementById("exchange-card-link");
    const qrNode = document.getElementById("share-modal-qr");

    if (shareModalTitle) {
        shareModalTitle.textContent = getPlainName();
    }

    if (shareSubrole) {
        shareSubrole.textContent = profileData?.profession || "Advocate";
    }

    if (exchangeCardLink) {
        exchangeCardLink.value = getCardUrl();
    }

    if (qrNode) {
        const qrCodeUrl = getQrCodeUrl();
        if (qrCodeUrl) {
            qrNode.src = qrCodeUrl;
        } else {
            qrNode.removeAttribute("src");
        }
    }

    buildShareLinks();
}

function submitExchangeForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) {
        return;
    }

    const formData = new FormData(form);
    const name = `${formData.get("name") || ""}`.trim();
    const mobile = `${formData.get("mobile") || ""}`.trim();
    const email = `${formData.get("email") || ""}`.trim();
    const company = `${formData.get("company") || ""}`.trim();
    const digitalCard = `${formData.get("digital_card") || ""}`.trim() || getCardUrl();

    const targetHref = getExchangeContactHref();
    const message = buildExchangeMessage({ name, mobile, email, company, digitalCard });

    if (!targetHref) {
        setStatus("exchange-modal-status", "Exchange contact destination not available.");
        return;
    }

    if (targetHref.startsWith("mailto:")) {
        const emailAddress = targetHref.replace(/^mailto:/i, "").split("?")[0];
        const subject = `Exchange Contact - ${name}`;
        window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        setStatus("exchange-modal-status", "Opening your email app...");
    } else {
        const whatsappNumber = getDigits(targetHref);
        if (!whatsappNumber) {
            setStatus("exchange-modal-status", "WhatsApp number not available.");
            return;
        }

        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
        setStatus("exchange-modal-status", "Opening WhatsApp...");
    }

    closeModal("exchange-modal-layer");
    form.reset();

    const exchangeCardLink = document.getElementById("exchange-card-link");
    if (exchangeCardLink) {
        exchangeCardLink.value = getCardUrl();
    }
}

function bindActionButtons() {
    const shareButton = document.getElementById("share-link");
    if (shareButton) {
        shareButton.addEventListener("click", () => {
            populateModals();
            setStatus("share-modal-status", "");
            openModal("share-modal-layer");
        });
    }

    const exchangeButton = document.getElementById("exchange-contact-link");
    if (exchangeButton) {
        exchangeButton.addEventListener("click", () => {
            populateModals();
            setStatus("exchange-modal-status", "");
            openModal("exchange-modal-layer");
        });
    }

    const saveButton = document.getElementById("save-contact-link");
    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            try {
                await saveContactCard();
            } catch (error) {
                console.error(error);
                setStatus("action-status", "Unable to download contact file.");
            }
        });
    }

    const copyUrlButton = document.getElementById("copy-url-button");
    if (copyUrlButton) {
        copyUrlButton.addEventListener("click", async () => {
            try {
                await copyCardUrl();
            } catch (error) {
                console.error(error);
                setStatus("share-modal-status", "Unable to copy digital card URL.");
            }
        });
    }

    const downloadPdfButton = document.getElementById("download-pdf-button");
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener("click", () => {
            window.print();
        });
    }

    const exchangeForm = document.getElementById("exchange-form");
    if (exchangeForm) {
        exchangeForm.addEventListener("submit", submitExchangeForm);
    }
}

function handleModalHash() {
    if (window.location.hash === "#share") {
        populateModals();
        openModal("share-modal-layer");
    }

    if (window.location.hash === "#exchange") {
        populateModals();
        openModal("exchange-modal-layer");
    }
}

function populateCard() {
    const data = profileData;

    document.title = data.pageTitle || document.title;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && data.pageDescription) {
        metaDescription.setAttribute("content", data.pageDescription);
    }

    const faviconLink = document.getElementById("favicon-link");
    if (faviconLink && data.favicon) {
        faviconLink.href = resolveAssetPath(data.favicon);
    }

    updateSocialMetadata();

    setImage("banner-image", data.bannerImage, "Law office banner");
    setImage("profile-image", data.profilePhoto, `${getPlainName()} portrait`);
    setImage("law-icon", data.lawIcon, "");
    setImage("powered-by-image", data.footerBrandImage, data.footerBrandAlt || "By");

    const nameNode = document.getElementById("name-html");
    if (nameNode) {
        nameNode.innerHTML = data.nameHtml || "";
    }

    const degreeNode = document.getElementById("degree-text");
    if (degreeNode) {
        degreeNode.textContent = data.degree || "";
    }

    const professionNode = document.getElementById("profession-text");
    if (professionNode) {
        professionNode.textContent = data.profession || "";
    }

    const practiceNode = document.getElementById("practice-area-text");
    if (practiceNode) {
        practiceNode.textContent = (data.practiceArea || "").toUpperCase();
    }

    const summaryNode = document.getElementById("summary-text");
    if (summaryNode) {
        summaryNode.textContent = data.summary || "";
    }

    const contactList = document.getElementById("contact-list");
    if (contactList) {
        contactList.innerHTML = "";

        (data.phones || []).forEach((phone) => {
            contactList.appendChild(createContactItem("phone_icon.svg", phone.label, phone.href));
        });

        if (data.email?.label) {
            contactList.appendChild(createContactItem("email_icon.svg", data.email.label, data.email.href));
        }
    }

    populateLinks("top-socials", data.topSocials, "social-icon-link");
    populateLinks("bottom-socials", data.bottomSocials, "bottom-social-link");
    populateServices(data.services);
    toggleVisibility("contact-list", contactList?.childElementCount > 0);
    toggleVisibility(document.querySelector(".contact-section"), (contactList?.childElementCount || 0) > 0 || document.getElementById("top-socials")?.childElementCount > 0);

    const officeNameNode = document.getElementById("office-name-text");
    if (officeNameNode) {
        officeNameNode.textContent = data.officeName || "";
    }

    const officeAddressNode = document.getElementById("office-address-html");
    if (officeAddressNode) {
        officeAddressNode.innerHTML = data.officeAddressHtml || "";
    }

    setLink("office-phone-link", data.officePhone?.href, data.officePhone?.label || "");
    setLink("office-email-link", data.officeEmail?.href, data.officeEmail?.label || "");
    setLink("map-link", data.mapLink);
    setLink("website-link", data.website?.href, data.website?.label || "");
    setLink("powered-by-link", data.footerBrandLink || data.website?.href);
    toggleVisibility("website-section", !!(`${data.website?.href || ""}`.trim() || `${data.website?.label || ""}`.trim()));
    toggleVisibility("footer-section", !!data.footerBrandImage);
    toggleVisibility("bottom-social-section", !!(`${data.mapLink || ""}`.trim()) || document.getElementById("bottom-socials")?.childElementCount > 0);
    toggleVisibility(document.getElementById("office-phone-link"), !!(`${data.officePhone?.href || ""}`.trim() || `${data.officePhone?.label || ""}`.trim()));
    toggleVisibility(document.getElementById("office-email-link"), !!(`${data.officeEmail?.href || ""}`.trim() || `${data.officeEmail?.label || ""}`.trim()));
    toggleVisibility(document.getElementById("office-address-html"), !!`${data.officeAddressHtml || ""}`.trim());
    toggleVisibility(document.getElementById("office-name-text"), !!`${data.officeName || ""}`.trim());
    toggleVisibility(document.querySelector(".office-section"), !!`${data.officeName || data.officeAddressHtml || data.officePhone?.label || data.officeEmail?.label || ""}`.trim());

    const downloadProfileButton = document.getElementById("download-profile-button");
    if (downloadProfileButton) {
        downloadProfileButton.addEventListener("click", () => {
            window.print();
        });
    }

    populateModals();
}

async function main() {
    await loadData();
    populateCard();
    bindModalDismissals();
    bindActionButtons();
    handleModalHash();
}

main().catch((error) => {
    console.error(error);
});
