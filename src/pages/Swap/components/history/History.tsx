import React, { useState, useEffect } from 'react';
import { Box, Text, Flex, useColorModeValue } from '@chakra-ui/react';
import { CloseIcon, AddIcon } from '../../../../theme/components/Icons';
import { removeSideTab, checkSideTab } from '../../../../utils/utilsFunctions';

const History = () => {
  const activeTabColor = useColorModeValue('#333333', '#F1F5F8');
  const nonActiveTabColor = useColorModeValue('#CCCCCC', '#4A739B');
  const iconColor = useColorModeValue('#666666', '#DCE5EF');
  const borderColor = useColorModeValue('#DEE5ED', '#324D68');

  const [sideBarRemoved, setSideBarRemoved] = useState<Boolean>(false);

  useEffect(() => {
    const isActive = checkSideTab('history');
    setSideBarRemoved(isActive);
  }, []);

  return (
    <Flex
      h="60px"
      border="1px"
      borderColor={borderColor}
      borderRadius="6px"
      alignItems="center"
      display={sideBarRemoved && 'none'}
    >
      <Box w="100%" pl={3} my={4} pr={3}>
        <Flex alignItems="center" justifyContent="space-between" px={4}>
          <Flex>
            <Text
              fontWeight="400"
              mr={3}
              fontSize="16px"
              color={activeTabColor}
            >
              Transaction History
            </Text>
            <Text fontWeight="400" fontSize="16px" color={nonActiveTabColor}>
              Market History
            </Text>
          </Flex>
          <Flex alignItems="center" fontWeight="bold" rounded={100} bg="#">
            <Flex
              border="2px"
              alignItems="center"
              justifyContent="center"
              mr={2}
              color={iconColor}
              borderColor={iconColor}
              w="22px"
              h="22px"
              borderRadius="6px"
            >
              <AddIcon />
            </Flex>
            <Flex
              border="2px"
              alignItems="center"
              justifyContent="center"
              color={iconColor}
              borderColor={iconColor}
              w="22px"
              h="22px"
              borderRadius="6px"
              cursor="pointer"
              onClick={() => {
                setSideBarRemoved(true);
                removeSideTab('history');
              }}
            >
              <CloseIcon />
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
};

export default History;