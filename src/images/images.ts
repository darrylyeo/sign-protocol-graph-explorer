import EthereumLogo from './Ethereum.svg'
import PolygonLogo from './Polygon.svg'
import BNBLogo from './BNB.svg'
import ZetaChainLogo from './ZetaChain.svg'
import BaseLogo from './Base.svg'
import BerachainLogo from './Berachain.svg'
import ArweaveLogo from './Arweave.svg'
import IPFSLogo from './IPFS.svg'
import type { chainIdToName } from '$/api/sign'


export const networkImages = {
	1: EthereumLogo,
	137: PolygonLogo,
	204: BNBLogo,
	7000: ZetaChainLogo,
	8453: BaseLogo,
	'arweave': ArweaveLogo,
	'ipfs': IPFSLogo,
} as const satisfies Record<keyof typeof chainIdToName, string>
