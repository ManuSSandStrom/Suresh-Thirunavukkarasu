let profileData = null;
let assetBasePath = "./Assets";

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

    setLink("share-link", data.shareHref);
    setLink("exchange-contact-link", data.exchangeContactHref);

    const saveContactLink = document.getElementById("save-contact-link");
    if (saveContactLink && data.vcardFile) {
        saveContactLink.href = resolveAssetPath(data.vcardFile);
        saveContactLink.download = "Suresh-Thirunavukkarasu.vcf";
    }

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
}

async function main() {
    await loadData();
    populateCard();
}

main().catch((error) => {
    console.error(error);
});
