import React, { useMemo, useState, useCallback } from 'react'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import { provider } from 'web3-core'
import { getContract } from 'utils/erc20'
import { Button, Flex, Text } from '@pancakeswap-libs/uikit'
import { Farm } from 'state/types'
import { useFarmFromNum, useFarmFromSymbol, useFarmUser } from 'state/hooks'
import useI18n from 'hooks/useI18n'
import UnlockButton from 'components/UnlockButton'
import { useApprove } from 'hooks/useApprove'
import { useApproveJava } from 'hooks/useApproveJava'
import { useApproveFAD } from 'hooks/useApproveFAD'
import { useMasterchef, useMasterchefJava, useMasterchefFAD } from 'hooks/useContract'
import StakeAction from './StakeAction'
import HarvestAction from './HarvestAction'
import HarvestActionJava from './HarvestActionJava'
import HarvestActionFAD from './HarvestActionFAD'


const Action = styled.div`
  padding-top: 16px;
`
export interface FarmWithStakedValue extends Farm {
  apy?: BigNumber
}

interface FarmCardActionsProps {
  farm: FarmWithStakedValue
  ethereum?: provider
  account?: string
}

const CardActions: React.FC<FarmCardActionsProps> = ({ farm, ethereum, account }) => {
  const TranslateString = useI18n()
  const [requestedApproval, setRequestedApproval] = useState(false)
  const { pid, lpAddresses, tokenAddresses, isTokenOnly, depositFeeBP } = useFarmFromNum(farm.num)
  const { allowance, tokenBalance, stakedBalance, earnings } = useFarmUser(farm.num)
  const lpAddress = lpAddresses[process.env.REACT_APP_CHAIN_ID]
  const tokenAddress = tokenAddresses[process.env.REACT_APP_CHAIN_ID];
  const lpName = farm.lpSymbol.toUpperCase()
  const isApproved = account && allowance && allowance.isGreaterThan(0)
  
  const lpContract = useMemo(() => {
    if(isTokenOnly){
      return getContract(ethereum as provider, tokenAddress);
    }
    return getContract(ethereum as provider, lpAddress);
  }, [ethereum, lpAddress, tokenAddress, isTokenOnly])

  const { onApprove } = useApprove(lpContract)
  const { onApproveJava } = useApproveJava(lpContract)
  const { onApproveFAD } = useApproveFAD(lpContract)

  const handleApprove = useCallback(async () => {
    try {
      setRequestedApproval(true)
      if (farm.earnToken === 'JAVA')
        await onApproveJava()
      else if (farm.earnToken === 'FAD')
        await onApproveFAD()
      else if (farm.earnToken === 'ANFT')
        await onApprove()
      setRequestedApproval(false)
    } catch (e) {
      console.error(e)
    }
  }, [onApprove, onApproveJava, onApproveFAD, farm.earnToken])

  const renderApprovalOrStakeButton = () => {
    return isApproved ? (
      <StakeAction stakedBalance={stakedBalance} tokenBalance={tokenBalance} tokenName={lpName} pid={farm.pid} earnToken={farm.earnToken} depositFeeBP={depositFeeBP} />
    ) : (
      <Button mt="8px"  disabled={requestedApproval} onClick={handleApprove}>
        {TranslateString(999, 'Approve Contract')}
      </Button>
    )
  }

  return (
    <Action>
      <Flex>
        <Text bold textTransform="uppercase" color="secondary" fontSize="12px" pr="3px">
        {farm.earnToken}
        </Text>
        <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
          {TranslateString(999, 'Earned')}
        </Text>
      </Flex>
      {farm.earnToken === 'ANFT' &&
        <HarvestAction earnings={earnings} pid={pid} />
      }
      {farm.earnToken === 'JAVA' &&
        <HarvestActionJava earnings={earnings} pid={pid} />
      }
      {farm.earnToken === 'FAD' &&
        <HarvestActionFAD earnings={earnings} pid={pid} />
      }
      <Flex>
        <Text bold textTransform="uppercase" color="secondary" fontSize="12px" pr="3px">
          {lpName}
        </Text>
        <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
          {TranslateString(999, 'Staked')}
        </Text>
      </Flex>
      {!account ? <UnlockButton mt="8px"  /> : renderApprovalOrStakeButton()}
    </Action>
  )
}

export default CardActions
