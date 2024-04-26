export class Releases {
    /**
     * Constructor for the Releases object. Don't call this directly!
     * ---
     * @param   array releases The parsed releases file
     * @returns object
     */
    constructor(releases = []) {
        if (typeof releases === 'undefined') {
            throw new Error('Cannot be called directly. Use Releases.build() to get a new instance.');
        }
        this.arches = [];
        this.bits = [32, 64];
        this.editions = [];
        this.releases = releases;
        this.releases.forEach((e) => {
            if (!this.arches.includes(e.archname)) this.arches.push(e.archname);
            Object.keys(e.edition).forEach((ed) => {
                if (!this.editions.includes(ed)) this.editions.push(ed);
            });
        });
    }

    /**
     * Grab our releases.json file, fix it a bit, create a new Releases object
     * ---
     * @param   string  releasesUri The path to the releases.json file
     * @returns array   data        A parsed data list that allows us to view data neatly
     */
    static async build(releasesUri = '') {
        const response = await fetch(releasesUri);
        const releases = await response.json();
        // add some sortable information to each release
        releases.forEach(element => {
            const versionParts = element.version.split('.', 4);
            const major = parseInt(versionParts?.[0] ?? "0", 10);
            const minor = parseInt(versionParts?.[1] ?? "0", 10);
            const patch = parseInt(versionParts?.[2] ?? "0", 10);
            const straw = parseInt(versionParts?.[3] ?? "0", 10);
            const is64Bit = String(element?.archname ?? '').includes('x64');

            element.sortable = {
                bits: is64Bit ? 64 : 32,
                major,
                minor,
                patch,
                straw,
            };

            // generate a set of links to show for the various editions
            element.links = [];
            if ('msi' in element.edition) {
                let url = element?.edition?.msi?.url;
                if (url) {
                    element.links.push({
                        url,
                        displayName: `strawberry-perl-${element.version}-64bit.msi`,
                        shortName: `${element.version} MSI`,
                        hash: element?.edition?.msi?.sha256,
                        size: element?.edition?.msi?.size,
                    });
                }
            }
            if ('portable' in element.edition) {
                let url = element?.edition?.portable?.url;
                if (url) {
                    element.links.push({
                        url,
                        displayName: `strawberry-perl-${element.version}-64bit-portable.zip`,
                        shortName: `${element.version} Portable zip`,
                        hash: element?.edition?.portable?.sha256,
                        size: element?.edition?.portable?.size,
                    });
                }
            }
            if ('pdl' in element.edition) {
                let url = element?.edition?.pdl?.url;
                if (url) {
                    element.links.push({
                        url,
                        displayName: `strawberry-perl-${element.version}-64bit-PDL.zip`,
                        shortName: `${element.version} PDL zip`,
                        hash: element?.edition?.pdl?.sha256,
                        size: element?.edition?.pdl?.size,
                    });
                }
            }
            if ('zip' in element.edition) {
                let url = element?.edition?.zip?.url;
                if (url) {
                    element.links.push({
                        url,
                        displayName: `strawberry-perl-${element.version}-64bit.zip`,
                        shortName: `${element.version} zip`,
                        hash: element?.edition?.zip?.sha256,
                        size: element?.edition?.zip?.size,
                    });
                }
            }
        });
        return new Releases(releases);
    }

    /**
     * Grab a list of architecture names.
     * You can filter by bits or all.
     * ---
     * @param   int     bits    64, 32, or all.
     * @returns array   numbers A sorted list of architecture versions
     */
    architechtureNames(bits = 0) {
        return this.arches.sort();
    }

    /**
     * Grab a list of major version numbers.
     * You can filter by bits or all.
     * ---
     * @param   int     bits    64, 32, or all.
     * @returns array   numbers A sorted list of versions numbers (Major)
     */
    versionNumbersMajor(bits = 0) {
        // get a list of versions potentially filtered on bits
        const filtered = this.versionsMajor(bits);
        const versions = [];
        filtered.forEach((element) => {
            if (!versions.includes(element.sortable.major)) versions.push(element.sortable.major);
        });
        return versions.sort((a, b) => a - b);
    }

    /**
     * Grab a list of minor version numbers for a given major.
     * You can filter by bits or all.
     * ---
     * @param   int     bits    Either 64, 32, or all.
     * @param   int     major   A major version number.
     * @returns array   numbers A sorted list of versions numbers (Minor)
     */
    versionNumbersMinor(bits = 0, major = 0) {
        // get a filtered list of versions based on bits and major version
        const filtered = this.versionsMinor(bits, major);

        const versions = [];
        filtered.forEach((element) => {
            if (!versions.includes(element.sortable.minor)) versions.push(element.sortable.minor);
        });
        return versions.sort((a, b) => a - b);
    }

    /**
     * Grab a list of patch version numbers for a given major, minor.
     * You can filter by bits or all.
     * ---
     * @param   int     bits    Either 64, 32, or all.
     * @param   int     major   A major version number.
     * @param   int     minor   A minor version number.
     * @returns array   numbers A sorted list of versions numbers (Minor)
     */
    versionNumbersPatch(bits = 0, major = 0, minor = 0) {
        // get a filtered list of versions based on bits and major version
        const filtered = this.versionsPatch(bits, major, minor);

        const versions = [];
        filtered.forEach((element) => {
            if (!versions.includes(element.sortable.patch)) versions.push(element.sortable.patch);
        });
        return versions.sort((a, b) => a - b);
    }

    /**
     * Grab a list of straw version numbers for a given major, minor, patch.
     * You can filter by bits or all.
     * ---
     * @param   int     bits    Either 64, 32, or all.
     * @param   int     major   A major version number.
     * @param   int     minor   A minor version number.
     * @param   int     patch   A patch version number.
     * @returns array   numbers A sorted list of versions numbers (Minor)
     */
    versionNumbersStraw(bits = 0, major = 0, minor = 0, patch = 0) {
        // get a filtered list of versions based on bits and major version
        const filtered = this.versionsStraw(bits, major, minor, patch);

        const versions = [];
        filtered.forEach((element) => {
            if (!versions.includes(element.sortable.straw)) versions.push(element.sortable.straw);
        });
        return versions.sort((a, b) => a - b);
    }

    /**
     * Grab a list of major versions. You can filter by bits or all.
     * ---
     * @param   int     bits        64, 32, or all.
     * @returns array   versions    A list of versions filtered by Major
     */
    versionsMajor(bits = 0) {
        if (this.bits.includes(bits)) return this.releases.filter((e) => e.sortable.bits === bits);
        return this.releases;
    }

    /**
     * Grab a list of minor versions for a given major.
     * You can filter by bits or all.
     * ---
     * @param   int     bits    Either 64, 32, or all.
     * @param   int     major   A major version number.
     * @returns array   numbers A list of versions (Minor)
     */
    versionsMinor(bits = 0, major = 0) {
        return this.releases.filter((element) => {
            if (element.sortable.major === major) {
                if (this.bits.includes(bits)) return element.sortable.bits === bits;
                return true;
            }
            return false;
        });
    }

    /**
     * Grab a list of patch versions for a given major and minor.
     * You can filter by bits or all.
     * ---
     * @param   int     bits    Either 64, 32, or all.
     * @param   int     major   A major version number.
     * @param   int     minor   A minor version number.
     * @returns array   numbers A list of versions (Patch).
     */
    versionsPatch(bits = 0, major = 0, minor = 0) {
        const filtered = this.versionsMinor(bits, major)
        return filtered.filter((element) => element.sortable.minor === minor);
    }

    /**
     * Grab a list of patch versions for a given major, minor, and patch.
     * You can filter by bits or all.
     * ---
     * @param   int     bits    Either 64, 32, or all.
     * @param   int     major   A major version number.
     * @param   int     minor   A minor version number.
     * @param   int     patch   A patch version number.
     * @returns array   numbers A list of versions (Strawberry release).
     */
    versionsStraw(bits = 0, major = 0, minor = 0, patch = 0) {
        const filtered = this.versionsPatch(bits, major, minor)
        return filtered.filter((element) => element.sortable.patch === patch);
    }

    /**
     * Grab the single latest release we have. Default to 64-bit on collision.
     * You can filter by bits or all.
     * ---
     * @param   int     bits    Either 64, 32, or all.
     * @returns object  data    A single latest object. If two exist, choose 64-bit.
     */
    latest(bits = 0) {
        const majors = this.versionNumbersMajor(bits);
        // console.log('majors: ', majors);
        const minors = this.versionNumbersMinor(bits, majors[majors.length - 1]);
        // console.log('minors: ', minors);
        const patches = this.versionNumbersPatch(bits, majors[majors.length - 1], minors[minors.length - 1]);
        // console.log('patches: ', patches);
        const straws = this.versionNumbersStraw(bits, majors[majors.length - 1], minors[minors.length - 1], patches[patches.length - 1]);
        // console.log('straws: ', straws);

        // we shoule now know the latest versions available.
        // let's get a list of releases with those bits and find the 
        let filtered = this.versionsStraw(bits, majors[majors.length - 1], minors[minors.length - 1], patches[patches.length - 1]);
        // return filtered;
        filtered = filtered.filter((e) => e.sortable.straw === straws[straws.length - 1]);
        if (filtered.length < 1) throw new Error('We had trouble finding the latest release.');
        if (filtered.length === 1) return filtered[0];
        return filtered.find((e) => e.sortable.bits === 64 || e.archname.includes('64int'));
    }
}

export function readableFileSize(size) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = 0;
    while (size >= 1024) {
        size /= 1024;
        ++i;
    }
    return size.toFixed(1) + ' ' + units[i];
}

export function tabify(element) {
    const header = element.querySelector('.sp-tabs-header');
    const content = element.querySelector('.sp-tabs');
    const tab_headers = [...header.children];
    const tab_contents = [...content.children];
    tab_contents.forEach(x => x.style.display = 'none');
    let current_tab_index = -1;

    function setTab(index) {
        if (current_tab_index > -1) {
            tab_headers[current_tab_index].style.fontWeight = 400;
            tab_contents[current_tab_index].style.display = 'none';
        }
        tab_headers[index].style.fontWeight = 800;
        tab_contents[index].style.display = 'flex';
        current_tab_index = index;
    }

    default_tab_index = tab_headers.findIndex(x => {
        return [...x.classList].indexOf('default-sp-tab') > -1;
    });

    default_tab_index = default_tab_index === -1 ? 0 : default_tab_index;
    setTab(default_tab_index);
    tab_headers.forEach((x, i) => x.onclick = event => setTab(i));
}
