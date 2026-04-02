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
    try {
        const response = await fetch("./data.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error("Unable to load data.json");
        }
        profileData = await response.json();
    } catch (error) {
        const fallbackNode = document.getElementById("profile-data-fallback");
        if (!fallbackNode) {
            throw error;
        }
        profileData = JSON.parse(fallbackNode.textContent);
    }

    assetBasePath = profileData.assetBasePath || "./Assets";
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
    return item;
}

function populateLinks(containerId, items, itemClassName) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    container.innerHTML = "";

    (items || []).forEach((item) => {
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
}

function populateServices(items) {
    const list = document.getElementById("service-list");
    if (!list) {
        return;
    }

    list.innerHTML = "";

    (items || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
    });
}

function setImage(id, path, alt = "") {
    const node = document.getElementById(id);
    if (!node || !path) {
        return;
    }

    node.src = resolveAssetPath(path);
    node.alt = alt;
}

function setLink(id, href, text) {
    const node = document.getElementById(id);
    if (!node) {
        return;
    }

    if (href) {
        node.href = href;
    }

    if (typeof text === "string") {
        node.textContent = text;
    }
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
    return profileData?.website?.href || profileData?.shareHref || window.location.href;
}

function getPlainName() {
    return `${profileData?.officeName || ""}`.replace(/\s+/g, " ").trim() || "Suresh Thirunavukkarasu";
}

function getQrCodeUrl() {
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=${encodeURIComponent(getCardUrl())}`;
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

    triggerDownload(resolveAssetPath(profileData.vcardFile), "Suresh-Thirunavukkarasu.vcf");
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
    const links = [
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
            icon: "email_icon.svg",
            label: "Share via Email",
            href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`Take a look at this digital card:\n${shareUrl}`)}`
        },
        {
            icon: "global_icon.svg",
            label: "Open digital card",
            href: shareUrl
        }
    ];

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
    setImage("share-modal-avatar", profileData?.profilePhoto, "Suresh Thirunavukkarasu portrait");

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
        qrNode.src = getQrCodeUrl();
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

    const targetEmail = profileData?.email?.label || profileData?.officeEmail?.label || "";
    const subject = `Exchange Contact - ${name}`;
    const body = [
        "Hello,",
        "",
        "Sharing my contact details with you:",
        "",
        `Name: ${name}`,
        `Mobile: ${mobile}`,
        `Email: ${email}`,
        `Company Name: ${company || "-"}`,
        `Digital Card: ${digitalCard}`,
        "",
        "Please share your contact card as well."
    ].join("\n");

    window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("exchange-modal-status", "Opening your email app...");
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

    setImage("banner-image", data.bannerImage, "Law office banner");
    setImage("profile-image", data.profilePhoto, "Suresh Thirunavukkarasu portrait");
    setImage("law-icon", data.lawIcon, "");
    setImage("powered-by-text-image", "PowerbyTxt.svg", "Powered by");
    setImage("powered-by-lawmines-image", "PoweredbyLawMines.svg", "Lawmines");
    setImage("powered-by-good-image", "PoweredbyGoodUX.svg", "Good");

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
    setLink("powered-by-link", data.website?.href);

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
