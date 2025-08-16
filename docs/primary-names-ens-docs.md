# Primary Names (ENS Docs)

_Last updated: **August 12, 2025**_

Primary names are now supported on **Ethereum Mainnet** and popular **L2s** — **Base**, **OP Mainnet**, **Arbitrum One**, **Scroll**, and **Linea** — enabling an end‑to‑end ENS experience on a user’s preferred chain.

---

## What is a “primary name”?

A **primary name** is a bidirectional relationship between an EVM address and a human‑readable ENS name:

1. **Name → Address** (forward resolution)
2. **Address → Name** (reverse resolution)

When both directions are correctly configured, applications can safely display ENS names instead of raw addresses (e.g., show `nick.eth` instead of `0xb8c...67d5`) for a better UX.

---

## Background

**Before August 2025**, users had to set a reverse record on Ethereum **Mainnet (L1)** using the **Reverse Registrar** contract to configure a primary name. That meant an L1 transaction was required even if the user primarily operated on an L2.

---

## Reverse record vs. primary name

- A **reverse record** maps an **EVM address → ENS name** (only half of the requirement).
- A **primary name** is valid only if the name also **forward‑resolves to the same address on the respective chain**.

> If forward and reverse resolution don’t match, apps should display the original address instead of the name.

---

## L2 Primary Names

You can now set **reverse records directly on L2s**:

- Arbitrum
- Base
- Linea
- OP Mainnet
- Scroll

In addition, you can set a **default reverse record on L1** that acts as a **fallback** when no chain‑specific primary name is set. This is the simplest path to a universal primary name for wallets that support multiple EVM chains.

---

## Understanding the verification process

Primary names must pass a two‑part verification on each chain:

1. **Forward:** The ENS name resolves to the address **on that chain** (via chain‑specific cointype, or via a default EVM address on the latest public resolver).
2. **Reverse:** The chain’s **Reverse Registrar** maps the address back to the same ENS name.

**Example**

- You own `nick.eth`. It currently resolves only to an **L1** address (e.g., `0x1234...5678`).
- You call `setName("nick.eth")` on **Base’s** Reverse Registrar, expecting your Base primary name to be set.
- This **fails verification** until `nick.eth` also resolves to the **Base (8453) address** for `0x1234...5678`.

You can set a chain‑specific address with your resolver (illustrative snippet):

```js
// Set a chain-specific address for Base (chainId 8453 → cointype 8453)
setAddr(
  namehash("nick.eth"),                 // node
  convertEVMChainIdToCoinType(8453),    // cointype for Base
  "0x1234...5678"                       // address to set
)
```

**Alternative (often easier):**  
Set the **default EVM address** for `nick.eth` on the latest **Public Resolver**, and set the **default reverse record** to `nick.eth` on the **default Reverse Registrar**. This allows resolution to work across all supported chains without per‑chain writes.

---

## Getting a primary name (lookup in apps)

Most web3 libraries expose a helper to look up a name by address and perform verification under the hood.

> **Note:** As of **August 12, 2025**, libraries had not yet shipped L2 Primary Names support; use the temporary reference implementation linked in the docs and remember that ENS resolution **always starts from Ethereum Mainnet**.

**Wagmi (example):**

```jsx
// https://wagmi.sh/react/hooks/useEnsName
import { useEnsName } from "wagmi"
import { mainnet } from "wagmi/chains"

export default function Name() {
  const { data: name } = useEnsName({
    address: "0xb8c2C29ee19D8307cb7255e1Cd...67d5",
    chainId: mainnet.id, // ENS resolution always starts on mainnet
  })
  return <div>Name: {name}</div>
}
```

**UX outcome example** (conceptual):  
`0xb8c…67d5 sent 0.1 ETH to 0xd8dA…6045` →  
`nick.eth sent 0.1 ETH to vitalik.eth`

For library and infra authors, the **Universal Resolver** simplifies implementation.

---

## Setting a primary name (how‑to)

Suppose address `0x1234...5678` wants `nick.eth` as the **Base** primary name.

**Option A: Per‑chain setup**

1. **Forward:** Set the **Base address** for `nick.eth` to `0x1234...5678` (see Multichain Addresses in the docs).
2. **Reverse:** Set the **reverse record** for `0x1234...5678` to `nick.eth` in the **Base Reverse Registrar**.

**Option B: Universal defaults (fewer steps)**

- Set the **default reverse record** to `nick.eth` on the **default Reverse Registrar**.
- Set the **default EVM address** for `nick.eth` to `0x1234...5678` on the **latest Public Resolver**.

---

## Related references

- Reverse Registrars (L1 & L2): `docs.ens.domains/registry/reverse`
- Public Resolver: `docs.ens.domains/resolvers/public`
- Universal Resolver: `docs.ens.domains/resolvers/universal`
- Resolution (incl. multichain addresses): `docs.ens.domains/web/resolution`
- ENS Web Docs (index): `docs.ens.domains/web`

---

_This markdown is a cleaned, human‑readable conversion of the ENS “Primary Names” documentation page to facilitate offline reading and editing._
