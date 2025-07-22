export enum VideoName {
    PeelRobalino = 'peel_robalino',
    AnnasKingForADay = 'annas_king_for_a_day',
    KatiesD20OnABus = 'katies_d20_on_a_bus',
    ErikasHaircut = 'erikas_haircut',
    SephiesSexyCarWash = 'sephies_sexy_car_wash',
    GrantsCrack = 'grants_crack',
    JonnysHumanPuppyBowl = 'jonnys_human_puppy_bowl',
    LilyAndIzzysMilkTasteTest = 'lily_and_izzys_milk_taste_test',
    IzzysButtholes = 'izzys_buttholes',
    VicsBrennansExitVideo = 'vics_brennans_exit_video'
}

export const VideoNames = [
    VideoName.PeelRobalino,
    VideoName.AnnasKingForADay,
    VideoName.KatiesD20OnABus,
    VideoName.ErikasHaircut,
    VideoName.SephiesSexyCarWash,
    VideoName.GrantsCrack,
    VideoName.JonnysHumanPuppyBowl,
    VideoName.LilyAndIzzysMilkTasteTest,
    VideoName.IzzysButtholes,
    VideoName.VicsBrennansExitVideo
];

export enum VideoPlatform {
    Youtube = 'youtube',
    Tiktok = 'tiktok',
    Reels = 'reels'
}

export const videoUrls = {
    [VideoName.PeelRobalino]: {
        [VideoPlatform.Youtube]: 'https://www.youtube.com/shorts/gMpx4A2lRTE', 
        [VideoPlatform.Tiktok]: 'https://www.tiktok.com/@gamechangershow/video/7527082801120677133',
        [VideoPlatform.Reels]: 'https://www.instagram.com/p/DMG0jk2tbeR/',
    },
    [VideoName.AnnasKingForADay]: {
        [VideoPlatform.Youtube]: 'https://www.youtube.com/shorts/UjHk90dxX20', 
        [VideoPlatform.Tiktok]: 'https://www.tiktok.com/@gamechangershow/video/7527078952171523341',
        [VideoPlatform.Reels]: 'https://www.instagram.com/p/DMGy8RuNDqI/',
    },
    [VideoName.KatiesD20OnABus]: {
        [VideoPlatform.Youtube]: 'https://www.youtube.com/shorts/5feqZBLXrMg', 
        [VideoPlatform.Tiktok]: 'https://www.tiktok.com/@gamechangershow/video/7527080453610704183',
        [VideoPlatform.Reels]: 'https://www.instagram.com/p/DMGzkMNNMXg/',
    },
    [VideoName.ErikasHaircut]: {
        [VideoPlatform.Youtube]: 'https://www.youtube.com/shorts/wQVIfuNIc9I', 
        [VideoPlatform.Tiktok]: 'https://www.tiktok.com/@gamechangershow/video/7527086113614318862',
        [VideoPlatform.Reels]: 'https://www.instagram.com/p/DMG2ELMvZdg/',
    },
    [VideoName.SephiesSexyCarWash]: {
        [VideoPlatform.Youtube]: 'https://www.youtube.com/shorts/HD5pyGbO_Is', 
        [VideoPlatform.Tiktok]: 'https://www.tiktok.com/@gamechangershow/video/7527082014449716494',
        [VideoPlatform.Reels]: 'https://www.instagram.com/p/DMG0OcPpSQO/',
    },
    [VideoName.GrantsCrack]: {
        [VideoPlatform.Youtube]: 'https://www.youtube.com/shorts/1lnl0jYln8s', 
        [VideoPlatform.Tiktok]: 'https://www.tiktok.com/@gamechangershow/video/7527083827689229582',
        [VideoPlatform.Reels]: 'https://www.instagram.com/p/DMG1BIPM41Z/',
    },
    [VideoName.JonnysHumanPuppyBowl]: {
        [VideoPlatform.Youtube]: 'https://www.youtube.com/shorts/aagwlycxv_k', 
        [VideoPlatform.Tiktok]: 'https://www.tiktok.com/@gamechangershow/video/7527084871580142861',
        [VideoPlatform.Reels]: 'https://www.instagram.com/p/DMG1d62Mhmf/',
    },
    [VideoName.LilyAndIzzysMilkTasteTest]: {
        [VideoPlatform.Youtube]: 'https://www.youtube.com/shorts/nfwmaVlp_hY', 
        [VideoPlatform.Tiktok]: 'https://www.tiktok.com/@gamechangershow/video/7527085610322890039',
        [VideoPlatform.Reels]: 'https://www.instagram.com/p/DMG11avO8qa/',
    },
    [VideoName.IzzysButtholes]: {
        [VideoPlatform.Youtube]: 'https://www.youtube.com/shorts/Wm8SMsmWCts', 
        [VideoPlatform.Tiktok]: 'https://www.tiktok.com/@gamechangershow/video/7527086642415422734',
        [VideoPlatform.Reels]: 'https://www.instagram.com/p/DMG2SXRMojo/',
    },
    [VideoName.VicsBrennansExitVideo]: {
        [VideoPlatform.Youtube]: 'https://www.youtube.com/shorts/oO4kgmYivoQ', 
        [VideoPlatform.Tiktok]: 'https://www.tiktok.com/@gamechangershow/video/7527087942339267895',
        [VideoPlatform.Reels]: 'https://www.instagram.com/p/DMG24Zjyg1j/',
    }
}